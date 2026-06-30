import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../prisma/client.js";
import { createAdminUser } from "./user.service.js";

vi.mock("../prisma/client.js", () => ({
  prisma: (() => {
    const mockPrisma = {
      $transaction: vi.fn((callback) => callback(mockPrisma)),
      user: {
        create: vi.fn(),
        findUnique: vi.fn(),
      },
      role: {
        findUnique: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
    };

    return mockPrisma;
  })(),
}));

const mockedUserCreate = vi.mocked(prisma.user.create);
const mockedUserFindUnique = vi.mocked(prisma.user.findUnique);
const mockedRoleFindUnique = vi.mocked(prisma.role.findUnique);
const mockedAuditLogCreate = vi.mocked(prisma.auditLog.create);

function adminUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "admin-1",
    organizationId: "org-1",
    email: "admin@example.com",
    name: "Operations Admin",
    passwordHash: "hashed-password",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    userRoles: [
      {
        role: {
          name: "admin",
        },
      },
    ],
    ...overrides,
  };
}

describe("user service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("creates an admin in the authenticated organization and assigns only the admin role", async () => {
    mockedUserFindUnique.mockResolvedValue(null);
    mockedRoleFindUnique.mockResolvedValue({ id: "role-admin" } as never);
    mockedUserCreate.mockResolvedValue(adminUser() as never);

    await expect(
      createAdminUser(
        "org-1",
        { name: "Operations Admin", email: "admin@example.com", password: "Password1" },
        "owner-1",
      ),
    ).resolves.toEqual({
      id: "admin-1",
      organizationId: "org-1",
      email: "admin@example.com",
      name: "Operations Admin",
      roles: ["admin"],
      createdAt: "2026-01-01T00:00:00.000Z",
    });

    expect(mockedRoleFindUnique).toHaveBeenCalledWith({
      where: {
        organizationId_name: {
          organizationId: "org-1",
          name: "admin",
        },
      },
      select: {
        id: true,
      },
    });
    expect(mockedUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: "org-1",
          email: "admin@example.com",
          name: "Operations Admin",
          userRoles: {
            create: {
              roleId: "role-admin",
            },
          },
        }),
      }),
    );
    expect(mockedAuditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: "org-1",
        userId: "owner-1",
        action: "user.admin.create",
        entityType: "User",
        entityId: "admin-1",
      }),
    });
  });

  it("rejects duplicate admin emails", async () => {
    mockedUserFindUnique.mockResolvedValue({ id: "existing-user" } as never);

    await expect(
      createAdminUser(
        "org-1",
        { name: "Operations Admin", email: "admin@example.com", password: "Password1" },
        "owner-1",
      ),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "EMAIL_ALREADY_EXISTS",
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("fails when the organization admin role is missing", async () => {
    mockedUserFindUnique.mockResolvedValue(null);
    mockedRoleFindUnique.mockResolvedValue(null);

    await expect(
      createAdminUser(
        "org-1",
        { name: "Operations Admin", email: "admin@example.com", password: "Password1" },
        "owner-1",
      ),
    ).rejects.toMatchObject({
      statusCode: 500,
      code: "ADMIN_ROLE_NOT_FOUND",
    });
    expect(mockedUserCreate).not.toHaveBeenCalled();
  });
});
