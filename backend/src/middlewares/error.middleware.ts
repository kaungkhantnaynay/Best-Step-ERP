import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";
import { logger } from "../utils/logger.js";

export function notFoundHandler(request: Request, response: Response) {
  response.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "Route not found",
      path: request.originalUrl,
      requestId: request.requestId,
    },
  });
}

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  const isAppError = error instanceof AppError;
  const statusCode = isAppError ? error.statusCode : 500;
  const code = isAppError ? error.code : "INTERNAL_SERVER_ERROR";
  const message = isAppError
    ? error.message
    : env.NODE_ENV === "production"
      ? "Internal server error"
      : error instanceof Error
        ? error.message
        : "Internal error";

  logger[statusCode >= 500 ? "error" : "warn"](
    {
      err: error,
      requestId: _request.requestId,
      userId: _request.user?.userId,
      organizationId: _request.user?.organizationId,
      statusCode,
      code,
    },
    "Request failed",
  );

  response.status(statusCode).json({
    error: {
      code,
      message,
      details: isAppError ? error.details : undefined,
      requestId: _request.requestId,
    },
  });
}
