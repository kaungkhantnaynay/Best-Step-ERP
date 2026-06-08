import { ShipmentStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  shipmentAssignSchema,
  shipmentCreateSchema,
  shipmentListQuerySchema,
  shipmentStatusUpdateSchema,
  trackingEventCreateSchema,
} from "./shipment.validators.js";

const orderId = "11111111-1111-4111-8111-111111111111";

describe("shipment validators", () => {
  it("normalizes create and assign payloads", () => {
    expect(
      shipmentCreateSchema.parse({
        orderId,
        carrier: " RoadLine ",
        trackingNumber: "",
      }),
    ).toEqual({
      orderId,
      carrier: "RoadLine",
      trackingNumber: null,
    });

    expect(shipmentAssignSchema.parse({ carrier: "FreightOne", trackingNumber: " TRK-1 " })).toEqual({
      carrier: "FreightOne",
      trackingNumber: "TRK-1",
    });
  });

  it("parses list filters and status updates", () => {
    expect(
      shipmentListQuerySchema.parse({ page: "2", limit: "25", status: ShipmentStatus.IN_TRANSIT }),
    ).toEqual({
      page: 2,
      limit: 25,
      status: ShipmentStatus.IN_TRANSIT,
    });
    expect(shipmentStatusUpdateSchema.parse({ status: ShipmentStatus.DELIVERED, location: "Dock 4" })).toEqual({
      status: ShipmentStatus.DELIVERED,
      location: "Dock 4",
      note: null,
    });
  });

  it("rejects invalid status updates and tracking events", () => {
    expect(() => shipmentStatusUpdateSchema.parse({ status: ShipmentStatus.PENDING })).toThrow();
    expect(() => trackingEventCreateSchema.parse({ status: "" })).toThrow();
  });
});
