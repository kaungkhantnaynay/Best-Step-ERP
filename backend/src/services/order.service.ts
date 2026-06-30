import { OrderStatus, Prisma, ProductStatus, StockMovementType } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { recordAuditLog } from "./audit.service.js";
import { queueNotification } from "./notification.service.js";
import { AppError } from "../utils/app-error.js";
import { parsePagePagination } from "../utils/pagination.js";
import type {
  OrderCreateInput,
  OrderListQuery,
  OrderStatusUpdateInput,
} from "../validators/order.validators.js";

const includeOrderRelations = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          sku: true,
          name: true,
          unit: true,
        },
      },
    },
    orderBy: { id: "asc" },
  },
  shipments: {
    select: {
      id: true,
      status: true,
      carrier: true,
      trackingNumber: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  },
} satisfies Prisma.OrderInclude;

type OrderRecord = Prisma.OrderGetPayload<{ include: typeof includeOrderRelations }>;
type NotificationInput = {
  organizationId: string;
  title: string;
  body: string;
};
type OrderTransaction = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

function toOrderResponse(order: OrderRecord) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    status: order.status,
    totalAmount: order.totalAmount.toNumber(),
    items: order.items.map((item) => ({
      id: item.id,
      product: item.product,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toNumber(),
      lineTotal: item.unitPrice.toNumber() * item.quantity,
    })),
    shipments: order.shipments.map((shipment) => ({
      ...shipment,
      createdAt: shipment.createdAt.toISOString(),
      updatedAt: shipment.updatedAt.toISOString(),
    })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

function buildOrderWhere(organizationId: string, query: OrderListQuery): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = { organizationId };

  if (query.status) where.status = query.status;
  if (query.search) {
    where.OR = [
      { orderNumber: { contains: query.search, mode: "insensitive" } },
      { customerName: { contains: query.search, mode: "insensitive" } },
    ];
  }

  return where;
}

async function getTenantOrder(tx: OrderTransaction, organizationId: string, orderId: string) {
  const order = await tx.order.findFirst({
    where: { id: orderId, organizationId },
    include: includeOrderRelations,
  });

  if (!order) throw new AppError(404, "ORDER_NOT_FOUND", "Order was not found");

  return order;
}

async function getActiveProducts(tx: OrderTransaction, organizationId: string, productIds: string[]) {
  const products = await tx.product.findMany({
    where: { id: { in: productIds }, organizationId, status: ProductStatus.ACTIVE },
    select: {
      id: true,
      price: true,
    },
  });

  if (products.length !== productIds.length) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "One or more active products were not found");
  }

  return new Map(products.map((product) => [product.id, product]));
}

async function allocateInventory(
  tx: OrderTransaction,
  input: {
    organizationId: string;
    orderNumber: string;
    productId: string;
    quantity: number;
  },
) {
  let remaining = input.quantity;
  const rows = await tx.inventory.findMany({
    where: {
      productId: input.productId,
      quantity: { gt: 0 },
      product: { organizationId: input.organizationId },
      bin: { warehouse: { organizationId: input.organizationId } },
    },
    include: {
      bin: {
        include: {
          warehouse: true,
        },
      },
    },
    orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
  });

  const available = rows.reduce((total, row) => total + row.quantity, 0);
  if (available < input.quantity) {
    throw new AppError(409, "INSUFFICIENT_STOCK", "Insufficient stock to reserve this order");
  }

  for (const row of rows) {
    if (remaining === 0) break;

    const quantity = Math.min(row.quantity, remaining);
    await tx.inventory.update({
      where: { id: row.id },
      data: { quantity: { decrement: quantity } },
    });
    await tx.stockMovement.create({
      data: {
        organizationId: input.organizationId,
        productId: input.productId,
        warehouseId: row.bin.warehouse.id,
        type: StockMovementType.RESERVE,
        quantity,
        reference: input.orderNumber,
      },
    });
    remaining -= quantity;
  }
}

async function releaseReservedInventory(
  tx: OrderTransaction,
  input: {
    organizationId: string;
    orderNumber: string;
  },
) {
  const movements = await tx.stockMovement.findMany({
    where: {
      organizationId: input.organizationId,
      reference: input.orderNumber,
      type: StockMovementType.RESERVE,
    },
    orderBy: { createdAt: "asc" },
  });

  for (const movement of movements) {
    const inventoryRow = await tx.inventory.findFirst({
      where: {
        productId: movement.productId,
        bin: {
          warehouseId: movement.warehouseId,
          warehouse: { organizationId: input.organizationId },
        },
      },
      orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
    });

    if (!inventoryRow) {
      throw new AppError(409, "RELEASE_BIN_NOT_FOUND", "Reserved inventory cannot be released without a warehouse bin");
    }

    await tx.inventory.update({
      where: { id: inventoryRow.id },
      data: { quantity: { increment: movement.quantity } },
    });
    await tx.stockMovement.create({
      data: {
        organizationId: input.organizationId,
        productId: movement.productId,
        warehouseId: movement.warehouseId,
        type: StockMovementType.RELEASE,
        quantity: movement.quantity,
        reference: input.orderNumber,
      },
    });
  }
}

async function recordFulfillmentMovements(
  tx: OrderTransaction,
  input: {
    organizationId: string;
    orderNumber: string;
  },
) {
  const movements = await tx.stockMovement.findMany({
    where: {
      organizationId: input.organizationId,
      reference: input.orderNumber,
      type: StockMovementType.RESERVE,
    },
    orderBy: { createdAt: "asc" },
  });

  if (movements.length === 0) {
    throw new AppError(409, "ORDER_NOT_RESERVED", "Order must have reserved stock before fulfillment");
  }

  for (const movement of movements) {
    await tx.stockMovement.create({
      data: {
        organizationId: input.organizationId,
        productId: movement.productId,
        warehouseId: movement.warehouseId,
        type: StockMovementType.FULFILLMENT,
        quantity: movement.quantity,
        reference: input.orderNumber,
      },
    });
  }
}

function assertStatusTransition(currentStatus: OrderStatus, nextStatus: OrderStatus) {
  const allowed: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.DRAFT]: [OrderStatus.CONFIRMED, OrderStatus.RESERVED, OrderStatus.CANCELLED],
    [OrderStatus.CONFIRMED]: [OrderStatus.RESERVED, OrderStatus.CANCELLED],
    [OrderStatus.RESERVED]: [OrderStatus.FULFILLED, OrderStatus.CANCELLED],
    [OrderStatus.FULFILLED]: [],
    [OrderStatus.CANCELLED]: [],
  };

  if (!allowed[currentStatus].includes(nextStatus)) {
    throw new AppError(409, "INVALID_ORDER_STATUS_TRANSITION", "Order status transition is not allowed");
  }
}

export async function listOrders(organizationId: string, query: OrderListQuery) {
  const pagination = parsePagePagination(query);
  const where = buildOrderWhere(organizationId, query);
  const [rows, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: includeOrderRelations,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders: rows.map(toOrderResponse),
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
}

export async function getOrder(organizationId: string, orderId: string) {
  return toOrderResponse(await getTenantOrder(prisma, organizationId, orderId));
}

export async function createOrder(organizationId: string, input: OrderCreateInput, userId?: string) {
  const result = await prisma.$transaction(async (tx) => {
    const productIds = [...new Set(input.items.map((item) => item.productId))];
    const products = await getActiveProducts(tx, organizationId, productIds);
    const orderItems = input.items.map((item) => {
      const unitPrice = item.unitPrice ?? products.get(item.productId)?.price.toNumber() ?? 0;

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: new Prisma.Decimal(unitPrice),
      };
    });
    const totalAmount = orderItems.reduce(
      (total, item) => total + item.unitPrice.toNumber() * item.quantity,
      0,
    );

    const order = await tx.order.create({
      data: {
        organizationId,
        orderNumber: input.orderNumber,
        customerName: input.customerName,
        status: OrderStatus.RESERVED,
        totalAmount: new Prisma.Decimal(totalAmount),
        items: { create: orderItems },
      },
      include: includeOrderRelations,
    });

    for (const item of orderItems) {
      await allocateInventory(tx, {
        organizationId,
        orderNumber: input.orderNumber,
        productId: item.productId,
        quantity: item.quantity,
      });
    }
    await recordAuditLog(
      {
        organizationId,
        userId,
        action: "order.create",
        entityType: "Order",
        entityId: order.id,
        metadata: {
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          itemCount: orderItems.length,
          totalAmount,
        },
      },
      tx,
    );

    const response = toOrderResponse(await getTenantOrder(tx, organizationId, order.id));
    const notification: NotificationInput = {
      organizationId,
      title: `Order reserved: ${order.orderNumber}`,
      body: `${order.customerName}'s order was created and inventory was reserved.`,
    };

    return { order: response, notification };
  });

  await queueNotification(result.notification);

  return result.order;
}

export async function updateOrderStatus(
  organizationId: string,
  orderId: string,
  input: OrderStatusUpdateInput,
  userId?: string,
) {
  const result = await prisma.$transaction(async (tx) => {
    const order = await getTenantOrder(tx, organizationId, orderId);
    assertStatusTransition(order.status, input.status);

    if (input.status === OrderStatus.RESERVED) {
      for (const item of order.items) {
        await allocateInventory(tx, {
          organizationId,
          orderNumber: order.orderNumber,
          productId: item.productId,
          quantity: item.quantity,
        });
      }
    }

    if (input.status === OrderStatus.FULFILLED) {
      await recordFulfillmentMovements(tx, { organizationId, orderNumber: order.orderNumber });
    }

    const updated = await tx.order.update({
      where: { id: orderId },
      data: { status: input.status },
      include: includeOrderRelations,
    });
    await recordAuditLog(
      {
        organizationId,
        userId,
        action: "order.status_update",
        entityType: "Order",
        entityId: orderId,
        metadata: { from: order.status, to: input.status, orderNumber: order.orderNumber },
      },
      tx,
    );

    const notification: NotificationInput = {
      organizationId,
      title: `Order status: ${order.orderNumber}`,
      body: `Order status changed from ${order.status} to ${input.status}.`,
    };

    return { order: toOrderResponse(updated), notification };
  });

  await queueNotification(result.notification);

  return result.order;
}

export async function cancelOrder(organizationId: string, orderId: string, userId?: string) {
  const result = await prisma.$transaction(async (tx) => {
    const order = await getTenantOrder(tx, organizationId, orderId);
    assertStatusTransition(order.status, OrderStatus.CANCELLED);

    if (order.status === OrderStatus.RESERVED) {
      await releaseReservedInventory(tx, {
        organizationId,
        orderNumber: order.orderNumber,
      });
    }

    const updated = await tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
      include: includeOrderRelations,
    });
    await recordAuditLog(
      {
        organizationId,
        userId,
        action: "order.cancel",
        entityType: "Order",
        entityId: orderId,
        metadata: { from: order.status, to: OrderStatus.CANCELLED, orderNumber: order.orderNumber },
      },
      tx,
    );

    const notification: NotificationInput = {
      organizationId,
      title: `Order cancelled: ${order.orderNumber}`,
      body: `Order ${order.orderNumber} was cancelled and reserved inventory was released when applicable.`,
    };

    return { order: toOrderResponse(updated), notification };
  });

  await queueNotification(result.notification);

  return result.order;
}
