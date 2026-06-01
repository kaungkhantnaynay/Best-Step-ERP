import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { ZodError } from "zod";
import { AppError } from "../utils/app-error.js";

type RequestSchemas = {
  params?: ZodType;
  query?: ZodType;
  body?: ZodType;
};

function formatZodError(error: ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}

export function validateRequest(schemas: RequestSchemas): RequestHandler {
  return (request, _response, next) => {
    try {
      if (schemas.params) {
        request.params = schemas.params.parse(request.params) as typeof request.params;
      }

      if (schemas.query) {
        request.query = schemas.query.parse(request.query) as typeof request.query;
      }

      if (schemas.body) {
        request.body = schemas.body.parse(request.body) as unknown;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new AppError(
            400,
            "VALIDATION_ERROR",
            "Request validation failed",
            formatZodError(error),
          ),
        );
        return;
      }

      next(error);
    }
  };
}
