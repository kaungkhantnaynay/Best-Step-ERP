import { describe, expect, it, vi } from "vitest";
import { AppError } from "../utils/app-error.js";
import { errorHandler, notFoundHandler } from "./error.middleware.js";

function createResponse() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
}

describe("error middleware", () => {
  it("returns the not found error shape", () => {
    const response = createResponse();

    notFoundHandler(
      { originalUrl: "/missing", requestId: "req-1" } as never,
      response as never,
    );

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({
      error: {
        code: "NOT_FOUND",
        message: "Route not found",
        path: "/missing",
        requestId: "req-1",
      },
    });
  });

  it("serializes operational errors safely", () => {
    const response = createResponse();

    errorHandler(
      new AppError(403, "PERMISSION_DENIED", "Nope", { permission: "x" }),
      { requestId: "req-2" } as never,
      response as never,
      vi.fn(),
    );

    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith({
      error: {
        code: "PERMISSION_DENIED",
        message: "Nope",
        details: { permission: "x" },
        requestId: "req-2",
      },
    });
  });
});
