import { describe, expect, it } from "vitest";
import {
  warehouseBinCreateSchema,
  warehouseCreateSchema,
  warehouseIdParamsSchema,
  warehouseListQuerySchema,
} from "./warehouse.validators.js";

describe("warehouse validators", () => {
  it("normalizes warehouse create payloads", () => {
    expect(
      warehouseCreateSchema.parse({
        name: "North Dock",
        code: "wh-north",
        address: "",
      }),
    ).toEqual({
      name: "North Dock",
      code: "WH-NORTH",
      address: "",
    });
  });

  it("parses list filters", () => {
    expect(warehouseListQuerySchema.parse({ page: "2", limit: "25", search: "dock" })).toEqual({
      page: 2,
      limit: 25,
      search: "dock",
    });
  });

  it("validates UUID params", () => {
    expect(
      warehouseIdParamsSchema.parse({ id: "9f1d4e7d-1b2f-4bcb-833a-7f1ac8f850c1" }),
    ).toEqual({ id: "9f1d4e7d-1b2f-4bcb-833a-7f1ac8f850c1" });
    expect(() => warehouseIdParamsSchema.parse({ id: "warehouse-1" })).toThrow();
  });

  it("validates warehouse and bin codes", () => {
    expect(warehouseBinCreateSchema.parse({ code: "a-01" })).toEqual({ code: "A-01" });
    expect(() => warehouseCreateSchema.parse({ name: "N", code: "bad code" })).toThrow();
    expect(() => warehouseBinCreateSchema.parse({ code: "" })).toThrow();
  });
});
