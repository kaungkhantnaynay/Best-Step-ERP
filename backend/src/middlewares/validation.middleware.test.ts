import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { AppError } from "../utils/app-error.js";
import { validateRequest } from "./validation.middleware.js";

describe("validateRequest", () => {
  it("parses request sections", () => {
    const next = vi.fn();
    const request = {
      params: { id: "abc" },
      query: { limit: "10" },
      body: { name: "Widget" },
    };

    validateRequest({
      params: z.object({ id: z.string().min(1) }),
      query: z.object({ limit: z.coerce.number().int() }),
      body: z.object({ name: z.string() }),
    })(request as never, {} as never, next);

    expect(request.query?.limit).toBe(10);
    expect(next).toHaveBeenCalledWith();
  });

  it("replaces getter-only query objects", () => {
    const next = vi.fn();
    const request: { params: object; body: object; query?: { limit: number } } = {
      params: {},
      body: {},
    };

    Object.defineProperty(request, "query", {
      configurable: true,
      enumerable: true,
      get: () => ({ limit: "10" }),
    });

    validateRequest({
      query: z.object({ limit: z.coerce.number().int() }),
    })(request as never, {} as never, next);

    expect(request.query?.limit).toBe(10);
    expect(next).toHaveBeenCalledWith();
  });

  it("passes validation errors to next", () => {
    const next = vi.fn();

    validateRequest({
      body: z.object({ name: z.string().min(1) }),
    })({ body: { name: "" } } as never, {} as never, next);

    const error = next.mock.calls[0][0] as AppError;
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.statusCode).toBe(400);
  });
});
