import { z } from "zod";

export const auditLogListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  entityType: z.string().trim().min(1).max(80).optional(),
  entityId: z.string().trim().min(1).max(120).optional(),
  action: z.string().trim().min(1).max(80).optional(),
});

export type AuditLogListQuery = z.infer<typeof auditLogListQuerySchema>;
