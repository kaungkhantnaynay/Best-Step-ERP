import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { env } from "../config/env.js";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/app-error.js";
import { requireAuth } from "./auth.middleware.js";

vi.mock("../prisma/client.js", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
    },
  },
}));

const mockedFindFirst = vi.mocked(prisma.user.findFirst);

describe("requireAuth", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    env.JWT_ACCESS_SECRET = "test-secret";
  });

  it("rejects missing bearer tokens", async () => {
    const next = vi.fn();

    await requireAuth(
      { header: vi.fn().mockReturnValue(undefined) } as never,
      {} as never,
      next,
    );

    const error = next.mock.calls[0][0] as AppError;
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe("AUTH_REQUIRED");
  });

  it("resolves user roles and permissions from a valid access token", async () => {
    const token = jwt.sign(
      { sub: "user-1", organizationId: "org-1", type: "access" },
      "test-secret",
    );
    const next = vi.fn();
    const request = {
      header: vi.fn().mockReturnValue(`Bearer ${token}`),
    };

    mockedFindFirst.mockResolvedValue({
      id: "user-1",
      organizationId: "org-1",
      userRoles: [
        {
          role: {
            name: "owner",
            rolePermissions: [
              { permission: { key: "products.read" } },
              { permission: { key: "products.write" } },
            ],
          },
        },
      ],
    } as never);

    await requireAuth(request as never, {} as never, next);

    expect(request).toMatchObject({
      user: {
        userId: "user-1",
        organizationId: "org-1",
        roles: ["owner"],
        permissions: ["products.read", "products.write"],
      },
    });
    expect(next).toHaveBeenCalledWith();
  });
});
