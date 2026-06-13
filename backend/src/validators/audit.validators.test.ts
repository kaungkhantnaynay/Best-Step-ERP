import { describe, expect, it } from "vitest";
import { auditLogListQuerySchema } from "./audit.validators.js";

describe("audit validators", () => {
  it("coerces pagination defaults and preserves supported filters", () => {
    const result = auditLogListQuerySchema.parse({
      page: "2",
      limit: "50",
      entityType: "Product",
      entityId: "product-1",
      action: "product.create",
    });

    expect(result).toEqual({
      page: 2,
      limit: 50,
      entityType: "Product",
      entityId: "product-1",
      action: "product.create",
    });
  });

  it("caps limit at 100", () => {
    expect(() => auditLogListQuerySchema.parse({ limit: "101" })).toThrow();
  });
});
