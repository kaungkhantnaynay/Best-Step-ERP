import type { CookieOptions, Request, Response } from "express";
import { env } from "../config/env.js";
import {
  getCurrentUser,
  login,
  logout,
  logoutAll,
  refresh,
  registerOwner,
  type AuthResult,
  type RefreshTokenMetadata,
} from "../services/auth.service.js";
import { AppError } from "../utils/app-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendCreated, sendOk } from "../utils/responses.js";

function refreshCookieOptions(maxAgeMs?: number): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/v1/auth",
    maxAge: maxAgeMs,
  };
}

function setRefreshCookie(response: Response, authResult: AuthResult) {
  response.cookie(
    env.REFRESH_TOKEN_COOKIE_NAME,
    authResult.refreshToken,
    refreshCookieOptions(authResult.refreshTokenMaxAgeMs),
  );
}

function clearRefreshCookie(response: Response) {
  response.clearCookie(env.REFRESH_TOKEN_COOKIE_NAME, refreshCookieOptions());
}

function toAuthResponse(authResult: AuthResult) {
  return {
    accessToken: authResult.accessToken,
    user: authResult.user,
  };
}

function getRefreshTokenCookie(request: Request) {
  const token = request.cookies?.[env.REFRESH_TOKEN_COOKIE_NAME];

  return typeof token === "string" ? token : undefined;
}

function getRefreshTokenMetadata(request: Request): RefreshTokenMetadata {
  return {
    userAgent: request.get("user-agent"),
    ipAddress: request.ip,
  };
}

export const register = asyncHandler(async (request, response) => {
  const authResult = await registerOwner(request.body, getRefreshTokenMetadata(request));

  setRefreshCookie(response, authResult);
  sendCreated(response, toAuthResponse(authResult));
});

export const loginUser = asyncHandler(async (request, response) => {
  const authResult = await login(request.body, getRefreshTokenMetadata(request));

  setRefreshCookie(response, authResult);
  sendOk(response, toAuthResponse(authResult));
});

export const refreshSession = asyncHandler(async (request, response) => {
  const refreshToken = getRefreshTokenCookie(request);

  if (!refreshToken) {
    throw new AppError(401, "REFRESH_TOKEN_REQUIRED", "Refresh token is required");
  }

  const authResult = await refresh(refreshToken, getRefreshTokenMetadata(request));

  setRefreshCookie(response, authResult);
  sendOk(response, toAuthResponse(authResult));
});

export const logoutUser = asyncHandler(async (request, response) => {
  await logout(getRefreshTokenCookie(request));
  clearRefreshCookie(response);
  sendOk(response, { success: true });
});

export const logoutAllUserSessions = asyncHandler(async (request, response) => {
  if (!request.user) {
    throw new AppError(401, "AUTH_REQUIRED", "Authentication is required");
  }

  const revokedCount = await logoutAll(request.user.userId, request.user.organizationId);

  clearRefreshCookie(response);
  sendOk(response, { success: true, revokedCount });
});

export const me = asyncHandler(async (request, response) => {
  if (!request.user) {
    throw new AppError(401, "AUTH_REQUIRED", "Authentication is required");
  }

  sendOk(response, {
    user: await getCurrentUser(request.user.userId, request.user.organizationId),
  });
});
