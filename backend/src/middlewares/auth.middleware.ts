import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../prisma/client.js";
import type { AccessTokenPayload } from "../types/request.js";
import { AppError } from "../utils/app-error.js";
import { logger } from "../utils/logger.js";

function getBearerToken(authorizationHeader: string | undefined) {
  if (!authorizationHeader) {
    return undefined;
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return undefined;
  }

  return token;
}

function isAccessTokenPayload(payload: string | jwt.JwtPayload): payload is AccessTokenPayload {
  return (
    typeof payload !== "string" &&
    typeof payload.sub === "string" &&
    typeof payload.organizationId === "string" &&
    payload.type === "access"
  );
}

export const requireAuth: RequestHandler = async (request, _response, next) => {
  const token = getBearerToken(request.header("authorization"));

  if (!token) {
    next(new AppError(401, "AUTH_REQUIRED", "Authentication is required"));
    return;
  }

  if (!env.JWT_ACCESS_SECRET) {
    next(new AppError(500, "AUTH_NOT_CONFIGURED", "Access token verification is not configured"));
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);

    if (!isAccessTokenPayload(payload)) {
      throw new AppError(401, "INVALID_TOKEN", "Access token is invalid");
    }

    const user = await prisma.user.findFirst({
      where: {
        id: payload.sub,
        organizationId: payload.organizationId,
      },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppError(401, "INVALID_TOKEN", "Access token subject was not found");
    }

    request.user = {
      userId: user.id,
      organizationId: user.organizationId,
      roles: user.userRoles.map((userRole) => userRole.role.name),
      permissions: [
        ...new Set(
          user.userRoles.flatMap((userRole) =>
            userRole.role.rolePermissions.map((rolePermission) => rolePermission.permission.key),
          ),
        ),
      ],
    };

    next();
  } catch (error) {
    logger.warn(
      {
        requestId: request.requestId,
        err: error,
      },
      "Authentication failed",
    );

    if (error instanceof AppError) {
      next(error);
      return;
    }

    next(new AppError(401, "INVALID_TOKEN", "Access token is invalid or expired"));
  }
};
