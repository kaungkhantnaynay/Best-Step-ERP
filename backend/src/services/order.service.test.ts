import { OrderStatus, ProductStatus, StockMovementType } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../prisma/client.js";
import { queueNotification } from "./notification.service.js";
import {
  cancelOrder,
  createOrder,
  getOrder,
  listOrders,
  updateOrderStatus,
} from "./order.service.js";

vi.mock("../prisma/client.js", () => ({
  prisma: (() => {
    const mockPrisma = {
      $transaction: vi.fn((callback) => callback(mockPrisma)),
      order: {
        count: vi.fn(),
        create: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
      product: {
        findMany: vi.fn(),
      },
      inventory: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
      stockMovement: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
    };

    return mockPrisma;
  })(),
}));

vi.mock("./notification.service.js", () => ({
  queueNotification: vi.fn(),
}));

const mockedOrderCount = vi.mocked(prisma.order.count);
const mockedOrderCreate = vi.mocked(prisma.order.create);
const mockedOrderFindFirst = vi.mocked(prisma.order.findFirst);
const mockedOrderFindMany = vi.mocked(prisma.order.findMany);
const mockedOrderUpdate = vi.mocked(prisma.order.update);
const mockedProductFindMany = vi.mocked(prisma.product.findMany);
const mockedInventoryFindFirst = vi.mocked(prisma.inventory.findFirst);
const mockedInventoryFindMany = vi.mocked(prisma.inventory.findMany);
const mockedInventoryUpdate = vi.mocked(prisma.inventory.update);
const mockedStockMovementCreate = vi.mocked(prisma.stockMovement.create);
const mockedStockMovementFindMany = vi.mocked(prisma.stockMovement.findMany);
const mockedQueueNotification = vi.mocked(queueNotification);

function decimal(value: number) {
  return { toNumber: () => value };
}

function product(overrides: Record<string, unknown> = {}) {
  return {
    id: "product-1",
    sku: "BS-SOLE-001",
    name: "Trail Runner Sole Kit",
    unit: "each",
    price: decimal(12),
    status: ProductStatus.ACTIVE,
    ...overrides,
  };
}

function order(overrides: Record<string, unknown> = {}) {
  return {
    id: "order-1",
    organizationId: "org-1",
    orderNumber: "SO-1001",
    customerName: "Summit Retail Co.",
    status: OrderStatus.RESERVED,
    totalAmount: decimal(24),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    items: [
      {
        id: "item-1",
        orderId: "order-1",
        productId: "product-1",
        quantity: 2,
        unitPrice: decimal(12),
        product: product(),
      },
    ],
    shipments: [],
    ...overrides,
  };
}

function inventoryRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "inventory-1",
    productId: "product-1",
    binId: "bin-1",
    quantity: 5,
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    bin: {
      id: "bin-1",
      warehouseId: "warehouse-1",
      warehouse: {
        id: "warehouse-1",
        organizationId: "org-1",
      },
    },
    ...overrides,
  };
}

function reserveMovement(overrides: Record<string, unknown> = {}) {
  return {
    id: "movement-1",
    organizationId: "org-1",
    productId: "product-1",
    warehouseId: "warehouse-1",
    type: StockMovementType.RESERVE,
    quantity: 2,
    reference: "SO-1001",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("order service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("lists tenant-scoped orders", async () => {
    mockedOrderFindMany.mockResolvedValue([order()] as never);
    mockedOrderCount.mockResolvedValue(1);

    const result = await listOrders("org-1", { page: 1, limit: 25 });

    expect(mockedOrderFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: "org-1" } }),
    );
    expect(result.orders[0]).toMatchObject({
      orderNumber: "SO-1001",
      totalAmount: 24,
      items: [{ product: { sku: "BS-SOLE-001" }, lineTotal: 24 }],
    });
  });

  it("gets tenant-scoped order details", async () => {
    mockedOrderFindFirst.mockResolvedValue(order() as never);

    await expect(getOrder("org-1", "order-1")).resolves.toMatchObject({
      id: "order-1",
      customerName: "Summit Retail Co.",
    });
    expect(mockedOrderFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "order-1", organizationId: "org-1" } }),
    );
  });

  it("creates an order and reserves inventory in one transaction", async () => {
    mockedProductFindMany.mockResolvedValue([{ id: "product-1", price: decimal(12) }] as never);
    mockedOrderCreate.mockResolvedValue(order() as never);
    mockedOrderFindFirst.mockResolvedValue(order() as never);
    mockedInventoryFindMany.mockResolvedValue([inventoryRow()] as never);

    await expect(
      createOrder("org-1", {
        orderNumber: "SO-1001",
        customerName: "Summit Retail Co.",
        items: [{ productId: "product-1", quantity: 2 }],
      }),
    ).resolves.toMatchObject({ status: OrderStatus.RESERVED, totalAmount: 24 });

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(mockedOrderCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: OrderStatus.RESERVED,
          totalAmount: expect.anything(),
        }),
      }),
    );
    expect(mockedInventoryUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "inventory-1" }, data: { quantity: { decrement: 2 } } }),
    );
    expect(mockedStockMovementCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: StockMovementType.RESERVE,
          warehouseId: "warehouse-1",
          reference: "SO-1001",
        }),
      }),
    );
    expect(mockedQueueNotification).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "org-1", title: "Order reserved: SO-1001" }),
    );
  });

  it("rejects order creation when stock is insufficient", async () => {
    mockedProductFindMany.mockResolvedValue([{ id: "product-1", price: decimal(12) }] as never);
    mockedOrderCreate.mockResolvedValue(order() as never);
    mockedInventoryFindMany.mockResolvedValue([inventoryRow({ quantity: 1 })] as never);

    await expect(
      createOrder("org-1", {
        orderNumber: "SO-1001",
        customerName: "Summit Retail Co.",
        items: [{ productId: "product-1", quantity: 2 }],
      }),
    ).rejects.toMatchObject({ code: "INSUFFICIENT_STOCK" });
  });

  it("records fulfillment movements from reservation movement warehouses", async () => {
    mockedOrderFindFirst.mockResolvedValue(order() as never);
    mockedStockMovementFindMany.mockResolvedValue([reserveMovement()] as never);
    mockedOrderUpdate.mockResolvedValue(order({ status: OrderStatus.FULFILLED }) as never);

    await updateOrderStatus("org-1", "order-1", { status: OrderStatus.FULFILLED });

    expect(mockedStockMovementCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: StockMovementType.FULFILLMENT, warehouseId: "warehouse-1" }),
      }),
    );
    expect(mockedOrderUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: OrderStatus.FULFILLED } }),
    );
    expect(mockedQueueNotification).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "org-1", title: "Order status: SO-1001" }),
    );
  });

  it("rejects invalid status transitions", async () => {
    mockedOrderFindFirst.mockResolvedValue(order({ status: OrderStatus.FULFILLED }) as never);

    await expect(
      updateOrderStatus("org-1", "order-1", { status: OrderStatus.RESERVED }),
    ).rejects.toMatchObject({ code: "INVALID_ORDER_STATUS_TRANSITION" });
    expect(mockedOrderUpdate).not.toHaveBeenCalled();
  });

  it("cancels a reserved order and releases inventory", async () => {
    mockedOrderFindFirst.mockResolvedValue(order() as never);
    mockedStockMovementFindMany.mockResolvedValue([reserveMovement()] as never);
    mockedInventoryFindFirst.mockResolvedValue(inventoryRow() as never);
    mockedOrderUpdate.mockResolvedValue(order({ status: OrderStatus.CANCELLED }) as never);

    await expect(cancelOrder("org-1", "order-1")).resolves.toMatchObject({
      status: OrderStatus.CANCELLED,
    });
    expect(mockedInventoryUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "inventory-1" }, data: { quantity: { increment: 2 } } }),
    );
    expect(mockedStockMovementCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: StockMovementType.RELEASE }) }),
    );
    expect(mockedQueueNotification).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "org-1", title: "Order cancelled: SO-1001" }),
    );
  });
});
