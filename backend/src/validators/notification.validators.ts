import { z } from "zod";

const uuidSchema = z.string().uuid();

export const notificationIdParamsSchema = z.object({
  id: uuidSchema,
});

export const notificationListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  unread: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
});

export type NotificationListQuery = {
  page?: number;
  limit?: number;
  unread?: boolean;
};
