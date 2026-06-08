import { OrderStatus } from "@prisma/client";
import { z } from "zod";

const uuidSchema = z.string().uuid();

export const orderIdParamsSchema = z.object({
  id: uuidSchema,
});

export const orderListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  status: z.nativeEnum(OrderStatus).optional(),
  search: z.string().trim().max(120).optional(),
});

export const orderCreateSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .min(2)
    .max(64)
    .transform((value) => value.toUpperCase()),
  customerName: z.string().trim().min(2).max(160),
  items: z
    .array(
      z.object({
        productId: uuidSchema,
        quantity: z.coerce.number().int().positive(),
        unitPrice: z.coerce.number().nonnegative().optional(),
      }),
    )
    .min(1)
    .max(100),
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum([OrderStatus.CONFIRMED, OrderStatus.RESERVED, OrderStatus.FULFILLED]),
});

export type OrderListQuery = z.infer<typeof orderListQuerySchema>;
export type OrderCreateInput = z.infer<typeof orderCreateSchema>;
export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>;
