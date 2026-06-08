import { StockMovementType } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  inventoryListQuerySchema,
  stockMovementListQuerySchema,
  stockMutationSchema,
} from "./inventory.validators.js";

const productId = "9f1d4e7d-1b2f-4bcb-833a-7f1ac8f850c1";
const warehouseId = "7d3b5c0e-1d3d-4f5d-9e3d-4511c07911b8";
const binId = "a1b2c3d4-1111-4222-8333-123456789abc";

describe("inventory validators", () => {
  it("parses inventory list filters", () => {
    expect(
      inventoryListQuerySchema.parse({
        page: "2",
        limit: "25",
        productId,
        warehouseId,
        binId,
        search: "sole",
        lowStock: "true",
      }),
    ).toEqual({
      page: 2,
      limit: 25,
      productId,
      warehouseId,
      binId,
      search: "sole",
      lowStock: true,
    });
  });

  it("normalizes stock mutation payloads", () => {
    expect(
      stockMutationSchema.parse({
        productId,
        binId,
        quantity: "12",
        reference: " PO-100 ",
      }),
    ).toEqual({
      productId,
      binId,
      quantity: 12,
      reference: "PO-100",
    });

    expect(stockMutationSchema.parse({ productId, binId, quantity: 1, reference: "" })).toMatchObject({
      reference: null,
    });
  });

  it("rejects malformed inventory mutations", () => {
    expect(() => stockMutationSchema.parse({ productId: "bad", binId, quantity: 1 })).toThrow();
    expect(() => stockMutationSchema.parse({ productId, binId, quantity: 0 })).toThrow();
  });

  it("parses stock movement filters", () => {
    expect(
      stockMovementListQuerySchema.parse({
        page: "1",
        limit: "50",
        productId,
        warehouseId,
        type: StockMovementType.STOCK_OUT,
      }),
    ).toEqual({
      page: 1,
      limit: 50,
      productId,
      warehouseId,
      type: StockMovementType.STOCK_OUT,
    });
  });
});
