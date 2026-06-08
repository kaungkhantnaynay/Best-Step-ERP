import { OrderStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  orderCreateSchema,
  orderListQuerySchema,
  orderStatusUpdateSchema,
} from "./order.validators.js";

const productId = "11111111-1111-4111-8111-111111111111";

describe("order validators", () => {
  it("normalizes order create payloads", () => {
    expect(
      orderCreateSchema.parse({
        orderNumber: " so-1001 ",
        customerName: "Summit Retail Co.",
        items: [{ productId, quantity: "2", unitPrice: "12.5" }],
      }),
    ).toEqual({
      orderNumber: "SO-1001",
      customerName: "Summit Retail Co.",
      items: [{ productId, quantity: 2, unitPrice: 12.5 }],
    });
  });

  it("rejects empty item lists and invalid status updates", () => {
    expect(() =>
      orderCreateSchema.parse({
        orderNumber: "SO-1001",
        customerName: "Summit Retail Co.",
        items: [],
      }),
    ).toThrow();
    expect(() => orderStatusUpdateSchema.parse({ status: OrderStatus.CANCELLED })).toThrow();
  });

  it("parses list filters", () => {
    expect(orderListQuerySchema.parse({ page: "2", limit: "25", status: OrderStatus.RESERVED })).toEqual({
      page: 2,
      limit: 25,
      status: OrderStatus.RESERVED,
    });
  });
});
