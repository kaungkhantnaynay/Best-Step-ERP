import { OrderStatus, ShipmentStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../prisma/client.js";
import {
  addTrackingEvent,
  assignShipment,
  createShipment,
  getShipment,
  listShipments,
  updateShipmentStatus,
} from "./shipment.service.js";

vi.mock("../prisma/client.js", () => ({
  prisma: (() => {
    const mockPrisma = {
      $transaction: vi.fn((callback) => callback(mockPrisma)),
      order: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      shipment: {
        count: vi.fn(),
        create: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
      trackingHistory: {
        create: vi.fn(),
      },
      notification: {
        create: vi.fn(),
      },
    };

    return mockPrisma;
  })(),
}));

const mockedOrderFindFirst = vi.mocked(prisma.order.findFirst);
const mockedOrderUpdate = vi.mocked(prisma.order.update);
const mockedShipmentCount = vi.mocked(prisma.shipment.count);
const mockedShipmentCreate = vi.mocked(prisma.shipment.create);
const mockedShipmentFindFirst = vi.mocked(prisma.shipment.findFirst);
const mockedShipmentFindMany = vi.mocked(prisma.shipment.findMany);
const mockedShipmentUpdate = vi.mocked(prisma.shipment.update);
const mockedTrackingHistoryCreate = vi.mocked(prisma.trackingHistory.create);
const mockedNotificationCreate = vi.mocked(prisma.notification.create);

function decimal(value: number) {
  return { toNumber: () => value };
}

function order(overrides: Record<string, unknown> = {}) {
  return {
    id: "order-1",
    orderNumber: "SO-1001",
    customerName: "Summit Retail Co.",
    status: OrderStatus.RESERVED,
    totalAmount: decimal(240),
    ...overrides,
  };
}

function trackingEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: "event-1",
    shipmentId: "shipment-1",
    status: ShipmentStatus.ASSIGNED,
    location: null,
    note: "Assigned to RoadLine.",
    createdAt: new Date("2026-01-02T00:00:00.000Z"),
    ...overrides,
  };
}

function shipment(overrides: Record<string, unknown> = {}) {
  return {
    id: "shipment-1",
    organizationId: "org-1",
    orderId: "order-1",
    carrier: "RoadLine",
    trackingNumber: "TRK-1001",
    status: ShipmentStatus.ASSIGNED,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    order: order(),
    trackingEvents: [trackingEvent()],
    ...overrides,
  };
}

describe("shipment service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("lists tenant-scoped shipments with order and tracking history", async () => {
    mockedShipmentFindMany.mockResolvedValue([shipment()] as never);
    mockedShipmentCount.mockResolvedValue(1);

    const result = await listShipments("org-1", { page: 1, limit: 25 });

    expect(mockedShipmentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: "org-1" } }),
    );
    expect(result.shipments[0]).toMatchObject({
      id: "shipment-1",
      order: { orderNumber: "SO-1001", totalAmount: 240 },
      trackingEvents: [{ note: "Assigned to RoadLine." }],
    });
  });

  it("gets tenant-scoped shipment details", async () => {
    mockedShipmentFindFirst.mockResolvedValue(shipment() as never);

    await expect(getShipment("org-1", "shipment-1")).resolves.toMatchObject({
      id: "shipment-1",
      carrier: "RoadLine",
    });
    expect(mockedShipmentFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "shipment-1", organizationId: "org-1" } }),
    );
  });

  it("creates a shipment and records the initial event and notification", async () => {
    mockedOrderFindFirst.mockResolvedValue(order() as never);
    mockedShipmentCreate.mockResolvedValue(shipment() as never);
    mockedShipmentFindFirst.mockResolvedValue(shipment() as never);

    await expect(
      createShipment("org-1", { orderId: "order-1", carrier: "RoadLine", trackingNumber: "TRK-1001" }),
    ).resolves.toMatchObject({ status: ShipmentStatus.ASSIGNED });

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(mockedShipmentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ organizationId: "org-1", status: ShipmentStatus.ASSIGNED }),
      }),
    );
    expect(mockedTrackingHistoryCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: ShipmentStatus.ASSIGNED }) }),
    );
    expect(mockedNotificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ title: "Shipment update: SO-1001" }) }),
    );
  });

  it("rejects shipment creation for cancelled orders", async () => {
    mockedOrderFindFirst.mockResolvedValue(order({ status: OrderStatus.CANCELLED }) as never);

    await expect(createShipment("org-1", { orderId: "order-1", carrier: null, trackingNumber: null })).rejects.toMatchObject({
      code: "ORDER_CANCELLED",
    });
    expect(mockedShipmentCreate).not.toHaveBeenCalled();
  });

  it("assigns an open shipment and moves pending shipments to assigned", async () => {
    mockedShipmentFindFirst.mockResolvedValue(shipment({ status: ShipmentStatus.PENDING }) as never);
    mockedShipmentUpdate.mockResolvedValue(
      shipment({ status: ShipmentStatus.ASSIGNED, carrier: "FreightOne" }) as never,
    );

    await assignShipment("org-1", "shipment-1", { carrier: "FreightOne", trackingNumber: "TRK-2" });

    expect(mockedShipmentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ carrier: "FreightOne", status: ShipmentStatus.ASSIGNED }),
      }),
    );
  });

  it("updates shipment status and fulfills the order when delivered", async () => {
    mockedShipmentFindFirst.mockResolvedValue(shipment({ status: ShipmentStatus.IN_TRANSIT }) as never);
    mockedShipmentUpdate.mockResolvedValue(shipment({ status: ShipmentStatus.DELIVERED }) as never);

    await updateShipmentStatus("org-1", "shipment-1", {
      status: ShipmentStatus.DELIVERED,
      location: "Customer dock",
      note: "Signed by receiver.",
    });

    expect(mockedShipmentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: ShipmentStatus.DELIVERED } }),
    );
    expect(mockedOrderUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "order-1" }, data: { status: OrderStatus.FULFILLED } }),
    );
  });

  it("rejects invalid shipment status transitions", async () => {
    mockedShipmentFindFirst.mockResolvedValue(shipment({ status: ShipmentStatus.DELIVERED }) as never);

    await expect(
      updateShipmentStatus("org-1", "shipment-1", { status: ShipmentStatus.IN_TRANSIT, location: null, note: null }),
    ).rejects.toMatchObject({ code: "INVALID_SHIPMENT_STATUS_TRANSITION" });
    expect(mockedShipmentUpdate).not.toHaveBeenCalled();
  });

  it("appends tracking events and returns refreshed shipment details", async () => {
    mockedShipmentFindFirst.mockResolvedValue(shipment() as never);

    await addTrackingEvent("org-1", "shipment-1", {
      status: "Arrived at sorting hub",
      location: "North Hub",
      note: "Loaded for final mile.",
    });

    expect(mockedTrackingHistoryCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "Arrived at sorting hub", location: "North Hub" }),
      }),
    );
  });
});
