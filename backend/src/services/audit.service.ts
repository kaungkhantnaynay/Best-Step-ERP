import { Prisma } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { parsePagePagination } from "../utils/pagination.js";
import type { AuditLogListQuery } from "../validators/audit.validators.js";

type AuditClient = Pick<typeof prisma, "auditLog">;

export type AuditLogInput = {
  organizationId: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
};

function toAuditLogResponse(row: {
  id: string;
  organizationId: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    organizationId: row.organizationId,
    userId: row.userId,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    metadata: row.metadata,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function recordAuditLog(input: AuditLogInput, client: AuditClient = prisma) {
  await client.auditLog.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata ?? Prisma.JsonNull,
    },
  });
}

export async function listAuditLogs(organizationId: string, query: AuditLogListQuery) {
  const pagination = parsePagePagination(query);
  const where: Prisma.AuditLogWhereInput = {
    organizationId,
    entityType: query.entityType,
    entityId: query.entityId,
    action: query.action,
  };
  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    auditLogs: rows.map(toAuditLogResponse),
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
}
