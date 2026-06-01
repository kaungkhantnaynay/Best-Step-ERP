import { beforeEach, describe, expect, it, vi } from "vitest";
import { env } from "../config/env.js";
import {
  getCurrentUser,
  login,
  logout,
  logoutAll,
  refresh,
  registerOwner,
} from "../services/auth.service.js";
import { AppError } from "../utils/app-error.js";
import {
  loginUser,
  logoutAllUserSessions,
  logoutUser,
  me,
  refreshSession,
  register,
} from "./auth.controller.js";

vi.mock("../services/auth.service.js", () => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  logoutAll: vi.fn(),
  refresh: vi.fn(),
  registerOwner: vi.fn(),
}));

const authResult = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
  refreshTokenMaxAgeMs: 2_592_000_000,
  user: {
    id: "user-1",
    email: "owner@example.com",
    name: "Owner User",
    organizationId: "org-1",
    organizationName: "Best Step",
    roles: ["owner"],
    permissions: ["auth.me"],
  },
};

function response() {
  return {
    cookie: vi.fn(),
    clearCookie: vi.fn(),
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
}

describe("auth controller", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    env.NODE_ENV = "test";
    env.REFRESH_TOKEN_COOKIE_NAME = "best_step_refresh";
  });

  it("sets an HttpOnly refresh cookie during registration", async () => {
    vi.mocked(registerOwner).mockResolvedValue(authResult);
    const res = response();

    await register({ body: {}, get: vi.fn(), ip: "127.0.0.1" } as never, res as never, vi.fn());

    expect(res.cookie).toHaveBeenCalledWith(
      "best_step_refresh",
      "refresh-token",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/api/v1/auth",
        maxAge: authResult.refreshTokenMaxAgeMs,
      }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      data: {
        accessToken: "access-token",
        user: authResult.user,
      },
    });
  });

  it("sets an HttpOnly refresh cookie during login and refresh", async () => {
    vi.mocked(login).mockResolvedValue(authResult);
    vi.mocked(refresh).mockResolvedValue(authResult);
    const loginResponse = response();
    const refreshResponse = response();

    await loginUser({ body: {}, get: vi.fn(), ip: "127.0.0.1" } as never, loginResponse as never, vi.fn());
    await refreshSession(
      { cookies: { best_step_refresh: "old-refresh-token" }, get: vi.fn(), ip: "127.0.0.1" } as never,
      refreshResponse as never,
      vi.fn(),
    );

    expect(loginResponse.cookie).toHaveBeenCalledWith(
      "best_step_refresh",
      "refresh-token",
      expect.objectContaining({ httpOnly: true }),
    );
    expect(refresh).toHaveBeenCalledWith("old-refresh-token", {
      userAgent: undefined,
      ipAddress: "127.0.0.1",
    });
    expect(refreshResponse.cookie).toHaveBeenCalledWith(
      "best_step_refresh",
      "refresh-token",
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it("rejects refresh without a cookie", async () => {
    const next = vi.fn();

    await refreshSession({ cookies: {} } as never, response() as never, next);

    const error = next.mock.calls[0][0] as AppError;
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe("REFRESH_TOKEN_REQUIRED");
  });

  it("clears the refresh cookie during logout", async () => {
    vi.mocked(logout).mockResolvedValue(undefined);
    const res = response();

    await logoutUser(
      { cookies: { best_step_refresh: "refresh-token" } } as never,
      res as never,
      vi.fn(),
    );

    expect(logout).toHaveBeenCalledWith("refresh-token");
    expect(res.clearCookie).toHaveBeenCalledWith(
      "best_step_refresh",
      expect.objectContaining({
        httpOnly: true,
        path: "/api/v1/auth",
      }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("revokes all refresh tokens for the current user", async () => {
    vi.mocked(logoutAll).mockResolvedValue(3);
    const res = response();

    await logoutAllUserSessions(
      { user: { userId: "user-1", organizationId: "org-1", roles: [], permissions: [] } } as never,
      res as never,
      vi.fn(),
    );

    expect(logoutAll).toHaveBeenCalledWith("user-1", "org-1");
    expect(res.clearCookie).toHaveBeenCalledWith(
      "best_step_refresh",
      expect.objectContaining({
        httpOnly: true,
        path: "/api/v1/auth",
      }),
    );
    expect(res.json).toHaveBeenCalledWith({
      data: {
        success: true,
        revokedCount: 3,
      },
    });
  });

  it("returns the current user from authenticated request context", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(authResult.user);
    const res = response();

    await me(
      { user: { userId: "user-1", organizationId: "org-1", roles: [], permissions: [] } } as never,
      res as never,
      vi.fn(),
    );

    expect(getCurrentUser).toHaveBeenCalledWith("user-1", "org-1");
    expect(res.json).toHaveBeenCalledWith({ data: { user: authResult.user } });
  });
});
