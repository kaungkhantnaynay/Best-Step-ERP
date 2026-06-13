import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../prisma/client.js";
import { listAuditLogs, recordAuditLog } from "./audit.service.js";

vi.mock("../prisma/client.js", () => ({
  prisma: {
    auditLog: {
      create: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

const mockedAuditLogCreate = vi.mocked(prisma.auditLog.create);
const mockedAuditLogCount = vi.mocked(prisma.auditLog.count);
const mockedAuditLogFindMany = vi.mocked(prisma.auditLog.findMany);

describe("audit service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("records tenant, actor, entity, action, and metadata", async () => {
    await recordAuditLog({
      organizationId: "org-1",
      userId: "user-1",
      action: "product.create",
      entityType: "Product",
      entityId: "product-1",
      metadata: { sku: "BS-001" },
    });

    expect(mockedAuditLogCreate).toHaveBeenCalledWith({
      data: {
        organizationId: "org-1",
        userId: "user-1",
        action: "product.create",
        entityType: "Product",
        entityId: "product-1",
        metadata: { sku: "BS-001" },
      },
    });
  });

  it("stores null JSON metadata when no metadata is supplied", async () => {
    await recordAuditLog({
      organizationId: "org-1",
      action: "auth.logout",
      entityType: "User",
      entityId: "user-1",
    });

    expect(mockedAuditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: "org-1",
        userId: null,
        metadata: Prisma.JsonNull,
      }),
    });
  });

  it("lists only tenant-scoped audit rows with filters and pagination", async () => {
    mockedAuditLogFindMany.mockResolvedValue([
      {
        id: "audit-1",
        organizationId: "org-1",
        userId: "user-1",
        action: "product.create",
        entityType: "Product",
        entityId: "product-1",
        metadata: { sku: "BS-001" },
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ] as never);
    mockedAuditLogCount.mockResolvedValue(1);

    const result = await listAuditLogs("org-1", {
      page: 2,
      limit: 10,
      entityType: "Product",
      entityId: "product-1",
      action: "product.create",
    });

    expect(mockedAuditLogFindMany).toHaveBeenCalledWith({
      where: {
        organizationId: "org-1",
        entityType: "Product",
        entityId: "product-1",
        action: "product.create",
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: 10,
      take: 10,
    });
    expect(result).toEqual({
      auditLogs: [
        {
          id: "audit-1",
          organizationId: "org-1",
          userId: "user-1",
          action: "product.create",
          entityType: "Product",
          entityId: "product-1",
          metadata: { sku: "BS-001" },
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      pagination: {
        page: 2,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    });
  });
});
