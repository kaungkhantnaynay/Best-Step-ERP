import { z } from "zod";

const uuidSchema = z.string().uuid();

const warehouseCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(2)
  .max(32)
  .regex(/^[A-Z0-9][A-Z0-9-]*$/, "Code must use uppercase letters, numbers, and hyphens");

export const warehouseIdParamsSchema = z.object({
  id: uuidSchema,
});

export const warehouseListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().max(120).optional(),
});

export const warehouseCreateSchema = z.object({
  name: z.string().trim().min(2).max(160),
  code: warehouseCodeSchema,
  address: z.string().trim().max(500).nullable().optional(),
});

export const warehouseBinCreateSchema = z.object({
  code: warehouseCodeSchema,
});

export const warehouseTransferSchema = z.object({
  productId: uuidSchema,
  fromBinId: uuidSchema,
  toBinId: uuidSchema,
  quantity: z.coerce.number().int().positive(),
  reference: z
    .string()
    .trim()
    .max(160)
    .nullable()
    .optional()
    .transform((value) => (value === undefined || value === null || value === "" ? null : value)),
});

export type WarehouseListQuery = z.infer<typeof warehouseListQuerySchema>;
export type WarehouseCreateInput = z.infer<typeof warehouseCreateSchema>;
export type WarehouseBinCreateInput = z.infer<typeof warehouseBinCreateSchema>;
export type WarehouseTransferInput = z.infer<typeof warehouseTransferSchema>;
