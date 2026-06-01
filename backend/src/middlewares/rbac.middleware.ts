import type { RequestHandler } from "express";
import { AppError } from "../utils/app-error.js";
import { logger } from "../utils/logger.js";

export function requirePermission(permissionKey: string): RequestHandler {
  return (request, _response, next) => {
    if (!request.user) {
      next(new AppError(401, "AUTH_REQUIRED", "Authentication is required"));
      return;
    }

    if (!request.user.permissions.includes(permissionKey)) {
      logger.warn(
        {
          requestId: request.requestId,
          userId: request.user.userId,
          organizationId: request.user.organizationId,
          permissionKey,
        },
        "Permission denied",
      );

      next(new AppError(403, "PERMISSION_DENIED", "You do not have permission to perform this action"));
      return;
    }

    next();
  };
}
