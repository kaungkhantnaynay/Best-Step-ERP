import { StockMovementType } from "@prisma/client";
import { z } from "zod";

const uuidSchema = z.string().uuid();

const referenceSchema = z
  .string()
  .trim()
  .max(160)
  .nullable()
  .optional()
  .transform((value) => (value === undefined || value === null || value === "" ? null : value));

export const inventoryListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  productId: uuidSchema.optional(),
  warehouseId: uuidSchema.optional(),
  binId: uuidSchema.optional(),
  search: z.string().trim().max(120).optional(),
  lowStock: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
});

export const stockMutationSchema = z.object({
  productId: uuidSchema,
  binId: uuidSchema,
  quantity: z.coerce.number().int().positive(),
  reference: referenceSchema,
});

export const stockMovementListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  productId: uuidSchema.optional(),
  warehouseId: uuidSchema.optional(),
  type: z.nativeEnum(StockMovementType).optional(),
});

export type InventoryListQuery = {
  page?: number;
  limit?: number;
  productId?: string;
  warehouseId?: string;
  binId?: string;
  search?: string;
  lowStock?: boolean;
};
export type StockMutationInput = z.infer<typeof stockMutationSchema>;
export type StockMovementListQuery = z.infer<typeof stockMovementListQuerySchema>;
