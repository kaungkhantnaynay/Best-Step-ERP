import { beforeEach, describe, expect, it, vi } from "vitest";
import { listAuditLogs } from "../services/audit.service.js";
import { AppError } from "../utils/app-error.js";
import { listAuditLogsController } from "./audit.controller.js";

vi.mock("../services/audit.service.js", () => ({
  listAuditLogs: vi.fn(),
}));

function response() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
}

describe("audit controller", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("lists tenant-scoped audit logs for the authenticated organization", async () => {
    vi.mocked(listAuditLogs).mockResolvedValue({
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
      pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
    });
    const res = response();

    await listAuditLogsController(
      {
        user: { userId: "user-1", organizationId: "org-1", roles: ["owner"], permissions: ["audit.read"] },
        query: { entityType: "Product" },
      } as never,
      res as never,
      vi.fn(),
    );

    expect(listAuditLogs).toHaveBeenCalledWith("org-1", { entityType: "Product" });
    expect(res.json).toHaveBeenCalledWith({
      data: [
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
      pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
    });
  });

  it("requires authentication context", async () => {
    const next = vi.fn();

    await listAuditLogsController({ query: {} } as never, response() as never, next);

    const error = next.mock.calls[0][0] as AppError;
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe("AUTH_REQUIRED");
  });
});
