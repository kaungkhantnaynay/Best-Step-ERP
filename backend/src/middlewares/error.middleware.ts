import type { NextFunction, Request, Response } from "express";

export function notFoundHandler(request: Request, response: Response) {
  response.status(404).json({
    error: "Not Found",
    path: request.originalUrl,
  });
}

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  const message = error instanceof Error ? error.message : "Internal error";

  response.status(500).json({
    error: "Internal Server Error",
    message,
  });
}
