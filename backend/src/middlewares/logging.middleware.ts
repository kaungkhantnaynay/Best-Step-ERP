import { pinoHttp } from "pino-http";
import type { Request, Response } from "express";
import { logger } from "../utils/logger.js";

export const requestLogger = pinoHttp({
  logger,
  customProps: (request: Request) => ({
    requestId: request.requestId,
    userId: request.user?.userId,
    organizationId: request.user?.organizationId,
  }),
  customLogLevel: (_request: Request, response: Response, error?: Error) => {
    if (error || response.statusCode >= 500) {
      return "error";
    }

    if (response.statusCode >= 400) {
      return "warn";
    }

    return "info";
  },
});
