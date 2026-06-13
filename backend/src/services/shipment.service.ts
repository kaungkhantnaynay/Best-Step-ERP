import { OrderStatus, Prisma, ShipmentStatus } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { recordAuditLog } from "./audit.service.js";
import { AppError } from "../utils/app-error.js";
import { parsePagePagination } from "../utils/pagination.js";
import type {
  ShipmentAssignInput,
  ShipmentCreateInput,
  ShipmentListQuery,
  ShipmentStatusUpdateInput,
  TrackingEventCreateInput,
} from "../validators/shipment.validators.js";

const includeShipmentRelations = {
  order: {
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      status: true,
      totalAmount: true,
    },
  },
  trackingEvents: {
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  },
} satisfies Prisma.ShipmentInclude;

type ShipmentRecord = Prisma.ShipmentGetPayload<{ include: typeof includeShipmentRelations }>;
type ShipmentTransaction = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

function toShipmentResponse(shipment: ShipmentRecord) {
  return {
    id: shipment.id,
    order: {
      ...shipment.order,
      totalAmount: shipment.order.totalAmount.toNumber(),
    },
    carrier: shipment.carrier,
    trackingNumber: shipment.trackingNumber,
    status: shipment.status,
    trackingEvents: shipment.trackingEvents.map((event) => ({
      id: event.id,
      status: event.status,
      location: event.location,
      note: event.note,
      createdAt: event.createdAt.toISOString(),
    })),
    createdAt: shipment.createdAt.toISOString(),
    updatedAt: shipment.updatedAt.toISOString(),
  };
}

function buildShipmentWhere(organizationId: string, query: ShipmentListQuery): Prisma.ShipmentWhereInput {
  const where: Prisma.ShipmentWhereInput = { organizationId };

  if (query.status) where.status = query.status;
  if (query.orderId) where.orderId = query.orderId;
  if (query.search) {
    where.OR = [
      { carrier: { contains: query.search, mode: "insensitive" } },
      { trackingNumber: { contains: query.search, mode: "insensitive" } },
      { order: { orderNumber: { contains: query.search, mode: "insensitive" } } },
      { order: { customerName: { contains: query.search, mode: "insensitive" } } },
    ];
  }

  return where;
}

async function getTenantOrder(tx: ShipmentTransaction, organizationId: string, orderId: string) {
  const order = await tx.order.findFirst({
    where: { id: orderId, organizationId },
    select: {
      id: true,
      orderNumber: true,
      status: true,
    },
  });

  if (!order) throw new AppError(404, "ORDER_NOT_FOUND", "Order was not found");
  if (order.status === OrderStatus.CANCELLED) {
    throw new AppError(409, "ORDER_CANCELLED", "Cancelled orders cannot be shipped");
  }

  return order;
}

async function getTenantShipment(tx: ShipmentTransaction, organizationId: string, shipmentId: string) {
  const shipment = await tx.shipment.findFirst({
    where: { id: shipmentId, organizationId },
    include: includeShipmentRelations,
  });

  if (!shipment) throw new AppError(404, "SHIPMENT_NOT_FOUND", "Shipment was not found");

  return shipment;
}

function assertStatusTransition(currentStatus: ShipmentStatus, nextStatus: ShipmentStatus) {
  const allowed: Record<ShipmentStatus, ShipmentStatus[]> = {
    [ShipmentStatus.PENDING]: [ShipmentStatus.ASSIGNED, ShipmentStatus.CANCELLED],
    [ShipmentStatus.ASSIGNED]: [ShipmentStatus.IN_TRANSIT, ShipmentStatus.CANCELLED],
    [ShipmentStatus.IN_TRANSIT]: [ShipmentStatus.DELIVERED, ShipmentStatus.CANCELLED],
    [ShipmentStatus.DELIVERED]: [],
    [ShipmentStatus.CANCELLED]: [],
  };

  if (!allowed[currentStatus].includes(nextStatus)) {
    throw new AppError(409, "INVALID_SHIPMENT_STATUS_TRANSITION", "Shipment status transition is not allowed");
  }
}

async function createTrackingEvent(
  tx: ShipmentTransaction,
  input: {
    shipmentId: string;
    status: string;
    location?: string | null;
    note?: string | null;
  },
) {
  return tx.trackingHistory.create({
    data: {
      shipmentId: input.shipmentId,
      status: input.status,
      location: input.location,
      note: input.note,
    },
  });
}

async function createShipmentNotification(
  tx: ShipmentTransaction,
  input: {
    organizationId: string;
    orderNumber: string;
    status: string;
  },
) {
  await tx.notification.create({
    data: {
      organizationId: input.organizationId,
      title: `Shipment update: ${input.orderNumber}`,
      body: `Shipment status changed to ${input.status}.`,
    },
  });
}

export async function listShipments(organizationId: string, query: ShipmentListQuery) {
  const pagination = parsePagePagination(query);
  const where = buildShipmentWhere(organizationId, query);
  const [rows, total] = await Promise.all([
    prisma.shipment.findMany({
      where,
      include: includeShipmentRelations,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.shipment.count({ where }),
  ]);

  return {
    shipments: rows.map(toShipmentResponse),
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
}

export async function getShipment(organizationId: string, shipmentId: string) {
  return toShipmentResponse(await getTenantShipment(prisma, organizationId, shipmentId));
}

export async function createShipment(organizationId: string, input: ShipmentCreateInput, userId?: string) {
  return prisma.$transaction(async (tx) => {
    const order = await getTenantOrder(tx, organizationId, input.orderId);
    const status = input.carrier ? ShipmentStatus.ASSIGNED : ShipmentStatus.PENDING;
    const shipment = await tx.shipment.create({
      data: {
        organizationId,
        orderId: input.orderId,
        carrier: input.carrier,
        trackingNumber: input.trackingNumber,
        status,
      },
      include: includeShipmentRelations,
    });

    await createTrackingEvent(tx, {
      shipmentId: shipment.id,
      status,
      note: input.carrier ? `Assigned to ${input.carrier}.` : "Shipment created.",
    });
    await createShipmentNotification(tx, {
      organizationId,
      orderNumber: order.orderNumber,
      status,
    });
    await recordAuditLog(
      {
        organizationId,
        userId,
        action: "shipment.create",
        entityType: "Shipment",
        entityId: shipment.id,
        metadata: {
          orderId: input.orderId,
          orderNumber: order.orderNumber,
          carrier: input.carrier,
          trackingNumber: input.trackingNumber,
          status,
        },
      },
      tx,
    );

    return toShipmentResponse(await getTenantShipment(tx, organizationId, shipment.id));
  });
}

export async function assignShipment(
  organizationId: string,
  shipmentId: string,
  input: ShipmentAssignInput,
  userId?: string,
) {
  return prisma.$transaction(async (tx) => {
    const shipment = await getTenantShipment(tx, organizationId, shipmentId);
    if (shipment.status === ShipmentStatus.DELIVERED || shipment.status === ShipmentStatus.CANCELLED) {
      throw new AppError(409, "SHIPMENT_CLOSED", "Delivered or cancelled shipments cannot be assigned");
    }

    const nextStatus = shipment.status === ShipmentStatus.PENDING ? ShipmentStatus.ASSIGNED : shipment.status;
    const updated = await tx.shipment.update({
      where: { id: shipmentId },
      data: {
        carrier: input.carrier,
        trackingNumber: input.trackingNumber,
        status: nextStatus,
      },
      include: includeShipmentRelations,
    });

    await createTrackingEvent(tx, {
      shipmentId,
      status: nextStatus,
      note: `Assigned to ${input.carrier}.`,
    });
    await createShipmentNotification(tx, {
      organizationId,
      orderNumber: shipment.order.orderNumber,
      status: nextStatus,
    });
    await recordAuditLog(
      {
        organizationId,
        userId,
        action: "shipment.assign",
        entityType: "Shipment",
        entityId: shipmentId,
        metadata: { carrier: input.carrier, trackingNumber: input.trackingNumber, status: nextStatus },
      },
      tx,
    );

    return toShipmentResponse(updated);
  });
}

export async function updateShipmentStatus(
  organizationId: string,
  shipmentId: string,
  input: ShipmentStatusUpdateInput,
  userId?: string,
) {
  return prisma.$transaction(async (tx) => {
    const shipment = await getTenantShipment(tx, organizationId, shipmentId);
    assertStatusTransition(shipment.status, input.status);

    const updated = await tx.shipment.update({
      where: { id: shipmentId },
      data: { status: input.status },
      include: includeShipmentRelations,
    });
    await createTrackingEvent(tx, {
      shipmentId,
      status: input.status,
      location: input.location,
      note: input.note,
    });
    await createShipmentNotification(tx, {
      organizationId,
      orderNumber: shipment.order.orderNumber,
      status: input.status,
    });

    if (input.status === ShipmentStatus.DELIVERED && shipment.order.status !== OrderStatus.FULFILLED) {
      await tx.order.update({
        where: { id: shipment.order.id },
        data: { status: OrderStatus.FULFILLED },
      });
    }
    await recordAuditLog(
      {
        organizationId,
        userId,
        action: "shipment.status_update",
        entityType: "Shipment",
        entityId: shipmentId,
        metadata: { from: shipment.status, to: input.status, location: input.location, note: input.note },
      },
      tx,
    );

    return toShipmentResponse(updated);
  });
}

export async function addTrackingEvent(
  organizationId: string,
  shipmentId: string,
  input: TrackingEventCreateInput,
  userId?: string,
) {
  return prisma.$transaction(async (tx) => {
    const shipment = await getTenantShipment(tx, organizationId, shipmentId);
    await createTrackingEvent(tx, {
      shipmentId,
      status: input.status,
      location: input.location,
      note: input.note,
    });
    await createShipmentNotification(tx, {
      organizationId,
      orderNumber: shipment.order.orderNumber,
      status: input.status,
    });
    await recordAuditLog(
      {
        organizationId,
        userId,
        action: "shipment.tracking_event.create",
        entityType: "Shipment",
        entityId: shipmentId,
        metadata: { status: input.status, location: input.location, note: input.note },
      },
      tx,
    );

    return toShipmentResponse(await getTenantShipment(tx, organizationId, shipmentId));
  });
}
