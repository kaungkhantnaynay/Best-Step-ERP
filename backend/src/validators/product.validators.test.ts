import { ProductStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  categoryCreateSchema,
  productCreateSchema,
  productListQuerySchema,
  productUpdateSchema,
} from "./product.validators.js";

describe("product validators", () => {
  it("normalizes product create payloads", () => {
    expect(
      productCreateSchema.parse({
        name: "Trail Runner Sole Kit",
        sku: "bs-sole-001",
        categoryId: "",
        unit: "each",
        price: "12.5",
        reorderLevel: "10",
      }),
    ).toMatchObject({
      sku: "BS-SOLE-001",
      categoryId: null,
      price: 12.5,
      reorderLevel: 10,
    });
  });

  it("rejects empty updates and invalid prices", () => {
    expect(() => productUpdateSchema.parse({})).toThrow();
    expect(() => productUpdateSchema.parse({ price: -1 })).toThrow();
  });

  it("parses list filters", () => {
    expect(productListQuerySchema.parse({ page: "2", limit: "25", status: ProductStatus.ACTIVE, lowStock: "true" })).toEqual({
      page: 2,
      limit: 25,
      status: ProductStatus.ACTIVE,
      lowStock: true,
    });
  });

  it("validates category creation", () => {
    expect(categoryCreateSchema.parse({ name: "Packaging" })).toEqual({ name: "Packaging" });
    expect(() => categoryCreateSchema.parse({ name: "" })).toThrow();
  });
});
