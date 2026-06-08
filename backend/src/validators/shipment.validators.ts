import { ShipmentStatus } from "@prisma/client";
import { z } from "zod";

const uuidSchema = z.string().uuid();

const optionalTextSchema = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .nullable()
    .optional()
    .transform((value) => (value === undefined || value === null || value === "" ? null : value));

export const shipmentIdParamsSchema = z.object({
  id: uuidSchema,
});

export const shipmentListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  status: z.nativeEnum(ShipmentStatus).optional(),
  orderId: uuidSchema.optional(),
  search: z.string().trim().max(120).optional(),
});

export const shipmentCreateSchema = z.object({
  orderId: uuidSchema,
  carrier: optionalTextSchema(120),
  trackingNumber: optionalTextSchema(120),
});

export const shipmentAssignSchema = z.object({
  carrier: z.string().trim().min(2).max(120),
  trackingNumber: optionalTextSchema(120),
});

export const shipmentStatusUpdateSchema = z.object({
  status: z.enum([
    ShipmentStatus.ASSIGNED,
    ShipmentStatus.IN_TRANSIT,
    ShipmentStatus.DELIVERED,
    ShipmentStatus.CANCELLED,
  ]),
  location: optionalTextSchema(160),
  note: optionalTextSchema(500),
});

export const trackingEventCreateSchema = z.object({
  status: z.string().trim().min(2).max(80),
  location: optionalTextSchema(160),
  note: optionalTextSchema(500),
});

export type ShipmentListQuery = z.infer<typeof shipmentListQuerySchema>;
export type ShipmentCreateInput = z.infer<typeof shipmentCreateSchema>;
export type ShipmentAssignInput = z.infer<typeof shipmentAssignSchema>;
export type ShipmentStatusUpdateInput = z.infer<typeof shipmentStatusUpdateSchema>;
export type TrackingEventCreateInput = z.infer<typeof trackingEventCreateSchema>;
