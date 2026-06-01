import bcrypt from "bcryptjs";
import { createHmac } from "node:crypto";
import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { env } from "../config/env.js";
import { prisma } from "../prisma/client.js";
import { cleanupExpiredRefreshTokens, login, logoutAll, refresh, registerOwner } from "./auth.service.js";

vi.mock("../prisma/client.js", () => ({
  prisma: {
    $transaction: vi.fn(),
    organization: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      deleteMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

const mockedUserFindUnique = vi.mocked(prisma.user.findUnique);
const mockedUserFindFirst = vi.mocked(prisma.user.findFirst);
const mockedOrganizationFindUnique = vi.mocked(prisma.organization.findUnique);
const mockedRefreshTokenCreate = vi.mocked(prisma.refreshToken.create);
const mockedRefreshTokenDeleteMany = vi.mocked(prisma.refreshToken.deleteMany);
const mockedRefreshTokenFindUnique = vi.mocked(prisma.refreshToken.findUnique);
const mockedRefreshTokenUpdateMany = vi.mocked(prisma.refreshToken.updateMany);
const mockedTransaction = vi.mocked(prisma.$transaction);

function authUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "user-1",
    organizationId: "org-1",
    email: "owner@example.com",
    name: "Owner User",
    passwordHash: "hash",
    organization: {
      name: "Best Step",
    },
    userRoles: [
      {
        role: {
          name: "owner",
          rolePermissions: [
            { permission: { key: "auth.me" } },
            { permission: { key: "products.read" } },
          ],
        },
      },
    ],
    ...overrides,
  };
}

function hashRefreshToken(rawToken: string) {
  return createHmac("sha256", env.JWT_REFRESH_SECRET!).update(rawToken).digest("hex");
}

describe("auth service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    env.JWT_ACCESS_SECRET = "access-secret";
    env.JWT_REFRESH_SECRET = "refresh-secret";
    env.JWT_ACCESS_EXPIRES_IN = "15m";
    env.JWT_REFRESH_EXPIRES_IN = "30d";
  });

  it("registers an organization owner with roles, tokens, and hashed refresh token storage", async () => {
    const tx = {
      permission: {
        findMany: vi.fn().mockResolvedValue([
          "auth.me",
          "users.manage",
          "roles.manage",
          "products.read",
          "products.write",
          "products.delete",
          "warehouses.read",
          "warehouses.write",
          "inventory.read",
          "inventory.write",
          "orders.read",
          "orders.write",
          "shipments.read",
          "shipments.write",
          "analytics.read",
          "notifications.read",
          "notifications.write",
          "audit.read",
        ].map((key) => ({ id: `permission-${key}`, key }))),
      },
      organization: {
        create: vi.fn().mockResolvedValue({ id: "org-1", name: "Best Step", slug: "best-step" }),
      },
      role: {
        upsert: vi
          .fn()
          .mockImplementation(({ where }) =>
            Promise.resolve({
              id: `role-${where.organizationId_name.name}`,
              name: where.organizationId_name.name,
            }),
          ),
      },
      rolePermission: {
        upsert: vi.fn().mockResolvedValue({}),
      },
      user: {
        create: vi.fn().mockResolvedValue(authUser({ userRoles: [] })),
        findFirstOrThrow: vi.fn().mockResolvedValue(authUser()),
      },
      userRole: {
        create: vi.fn().mockResolvedValue({ userId: "user-1", roleId: "role-owner" }),
      },
      refreshToken: {
        create: vi.fn().mockResolvedValue({ id: "refresh-1" }),
      },
    };

    mockedUserFindUnique.mockResolvedValue(null);
    mockedOrganizationFindUnique.mockResolvedValue(null);
    mockedTransaction.mockImplementation(async (callback) => callback(tx as never));

    const result = await registerOwner({
      organizationName: "Best Step",
      organizationSlug: "best-step",
      name: "Owner User",
      email: "owner@example.com",
      password: "Password1",
    });

    expect(tx.organization.create).toHaveBeenCalledWith({
      data: {
        name: "Best Step",
        slug: "best-step",
      },
    });
    expect(tx.role.upsert).toHaveBeenCalledTimes(4);
    expect(tx.rolePermission.upsert).toHaveBeenCalledWith({
      where: {
        roleId_permissionId: {
          roleId: "role-owner",
          permissionId: "permission-auth.me",
        },
      },
      update: {},
      create: {
        roleId: "role-owner",
        permissionId: "permission-auth.me",
      },
    });
    expect(tx.userRole.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        roleId: "role-owner",
      },
    });
    expect(tx.refreshToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: "org-1",
        userId: "user-1",
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date),
      }),
    });
    expect(tx.refreshToken.create.mock.calls[0][0].data.tokenHash).not.toBe(result.refreshToken);
    expect(result).toMatchObject({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
      user: {
        id: "user-1",
        organizationId: "org-1",
        organizationName: "Best Step",
        roles: ["owner"],
        permissions: ["auth.me", "products.read"],
      },
    });
  });

  it("rejects duplicate registration email", async () => {
    mockedUserFindUnique.mockResolvedValue({ id: "existing-user" } as never);

    await expect(
      registerOwner({
        organizationName: "Best Step",
        organizationSlug: "best-step",
        name: "Owner User",
        email: "owner@example.com",
        password: "Password1",
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "EMAIL_ALREADY_EXISTS",
    });
  });

  it("logs in with valid credentials and rejects invalid credentials", async () => {
    const passwordHash = await bcrypt.hash("Password1", 4);

    mockedUserFindUnique.mockResolvedValue(authUser({ passwordHash }) as never);
    mockedRefreshTokenCreate.mockResolvedValue({ id: "refresh-1" } as never);

    const result = await login({ email: "owner@example.com", password: "Password1" });

    expect(result.accessToken).toEqual(expect.any(String));
    expect(mockedRefreshTokenCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tokenHash: expect.any(String),
        lastUsedAt: expect.any(Date),
      }),
    });

    await expect(login({ email: "owner@example.com", password: "wrong" })).rejects.toMatchObject({
      statusCode: 401,
      code: "INVALID_CREDENTIALS",
    });
  });

  it("stores refresh token device metadata without raw IP addresses", async () => {
    const passwordHash = await bcrypt.hash("Password1", 4);

    mockedUserFindUnique.mockResolvedValue(authUser({ passwordHash }) as never);
    mockedRefreshTokenCreate.mockResolvedValue({ id: "refresh-1" } as never);

    await login(
      { email: "owner@example.com", password: "Password1" },
      { userAgent: "Vitest Browser", ipAddress: "203.0.113.10" },
    );

    expect(mockedRefreshTokenCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userAgent: "Vitest Browser",
        ipAddressHash: expect.any(String),
      }),
    });
    expect(mockedRefreshTokenCreate.mock.calls[0][0].data.ipAddressHash).not.toBe("203.0.113.10");
  });

  it("rotates refresh tokens in one family", async () => {
    const rawToken = jwt.sign(
      { sub: "user-1", organizationId: "org-1", familyId: "family-1", jti: "token-1", type: "refresh" },
      env.JWT_REFRESH_SECRET!,
      { expiresIn: "30d" },
    );

    mockedRefreshTokenFindUnique.mockResolvedValue({
      id: "refresh-1",
      organizationId: "org-1",
      userId: "user-1",
      familyId: "family-1",
      tokenHash: hashRefreshToken(rawToken),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      replacedByTokenId: null,
    } as never);
    mockedUserFindFirst.mockResolvedValue(authUser() as never);
    mockedTransaction.mockImplementation(async (callback) =>
      callback({
        refreshToken: {
          create: vi.fn().mockResolvedValue({ id: "refresh-2" }),
          update: vi.fn().mockResolvedValue({ id: "refresh-1" }),
        },
      } as never),
    );

    const result = await refresh(rawToken);

    expect(result.refreshToken).not.toBe(rawToken);
    expect(mockedTransaction).toHaveBeenCalled();
  });

  it("revokes a refresh token family when token reuse is detected", async () => {
    const rawToken = jwt.sign(
      { sub: "user-1", organizationId: "org-1", familyId: "family-1", jti: "token-1", type: "refresh" },
      env.JWT_REFRESH_SECRET!,
      { expiresIn: "30d" },
    );

    mockedRefreshTokenFindUnique.mockResolvedValue({
      id: "refresh-1",
      organizationId: "org-1",
      userId: "user-1",
      familyId: "family-1",
      tokenHash: hashRefreshToken(rawToken),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: new Date(),
      replacedByTokenId: "refresh-2",
    } as never);
    mockedRefreshTokenUpdateMany.mockResolvedValue({ count: 2 } as never);

    await expect(refresh(rawToken)).rejects.toMatchObject({
      statusCode: 401,
      code: "REFRESH_TOKEN_REUSED",
    });
    expect(mockedRefreshTokenUpdateMany).toHaveBeenCalledWith({
      where: {
        familyId: "family-1",
      },
      data: expect.objectContaining({
        revokedAt: expect.any(Date),
        revokedReason: "token_reuse_detected",
      }),
    });
  });

  it("revokes all refresh tokens for a user", async () => {
    mockedRefreshTokenUpdateMany.mockResolvedValue({ count: 3 } as never);

    await expect(logoutAll("user-1", "org-1")).resolves.toBe(3);
    expect(mockedRefreshTokenUpdateMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        organizationId: "org-1",
        revokedAt: null,
      },
      data: expect.objectContaining({
        revokedAt: expect.any(Date),
        revokedReason: "logout_all",
      }),
    });
  });

  it("cleans up expired and old revoked refresh tokens", async () => {
    mockedRefreshTokenDeleteMany.mockResolvedValue({ count: 4 } as never);

    await expect(cleanupExpiredRefreshTokens(15)).resolves.toBe(4);
    expect(mockedRefreshTokenDeleteMany).toHaveBeenCalledWith({
      where: {
        OR: [
          {
            expiresAt: {
              lt: expect.any(Date),
            },
          },
          {
            revokedAt: {
              lt: expect.any(Date),
            },
          },
        ],
      },
    });
  });
});
