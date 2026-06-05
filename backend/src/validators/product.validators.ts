import { ProductStatus } from "@prisma/client";
import { z } from "zod";

const uuidSchema = z.string().uuid();
const nullableCategorySchema = z
  .union([uuidSchema, z.literal(""), z.null()])
  .optional()
  .transform((value) => (value === "" ? null : value));

export const productIdParamsSchema = z.object({
  id: uuidSchema,
});

export const productListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().max(120).optional(),
  status: z.nativeEnum(ProductStatus).optional(),
  categoryId: uuidSchema.optional(),
  lowStock: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
});

export const productCreateSchema = z.object({
  name: z.string().trim().min(2).max(160),
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .min(3)
    .max(64)
    .regex(/^[A-Z0-9][A-Z0-9-]*$/, "SKU must use uppercase letters, numbers, and hyphens")
    .optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  categoryId: nullableCategorySchema,
  unit: z.string().trim().min(1).max(40),
  price: z.coerce.number().min(0),
  reorderLevel: z.coerce.number().int().min(0),
  status: z.nativeEnum(ProductStatus).optional(),
});

export const productUpdateSchema = productCreateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one product field must be provided",
);

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
});

export type ProductListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProductStatus;
  categoryId?: string;
  lowStock?: boolean;
};
export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
