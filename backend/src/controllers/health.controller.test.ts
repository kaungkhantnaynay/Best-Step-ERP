import { describe, expect, it, vi } from "vitest";
import { healthCheck } from "./health.controller.js";

describe("healthCheck", () => {
  it("returns the API health payload", () => {
    const response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    healthCheck({} as never, response as never);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      status: "ok",
      service: "best-step-api",
    });
  });
});
