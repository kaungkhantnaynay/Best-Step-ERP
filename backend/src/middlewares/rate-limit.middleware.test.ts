import { describe, expect, it, vi } from "vitest";
import { AppError } from "../utils/app-error.js";
import { createMemoryRateLimitStore, rateLimit } from "./rate-limit.middleware.js";

function createResponse() {
  return {
    setHeader: vi.fn(),
  };
}

describe("rateLimit", () => {
  it("allows requests below the limit", async () => {
    const next = vi.fn();

    await rateLimit({
      name: "test",
      maxRequests: 2,
      windowMs: 10_000,
      store: createMemoryRateLimitStore(),
      keyGenerator: () => "key",
    })({} as never, createResponse() as never, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("blocks requests over the limit", async () => {
    const limiter = rateLimit({
      name: "test",
      maxRequests: 1,
      windowMs: 10_000,
      store: createMemoryRateLimitStore(),
      keyGenerator: () => "key",
    });
    const response = createResponse();
    const next = vi.fn();

    await limiter({} as never, response as never, vi.fn());
    await limiter({} as never, response as never, next);

    const error = next.mock.calls[0][0] as AppError;
    expect(error.statusCode).toBe(429);
    expect(error.code).toBe("RATE_LIMITED");
    expect(response.setHeader).toHaveBeenCalledWith("Retry-After", expect.any(Number));
  });

  it("keys authenticated limits by organization and user by default", async () => {
    const limiter = rateLimit({
      name: "test-authenticated",
      maxRequests: 1,
      windowMs: 10_000,
      store: createMemoryRateLimitStore(),
    });
    const nextForFirstUser = vi.fn();
    const nextForSecondUser = vi.fn();
    const nextForSecondOrganization = vi.fn();

    const firstUser = {
      user: { userId: "user-1", organizationId: "org-1" },
      ip: "127.0.0.1",
    };

    await limiter(firstUser as never, createResponse() as never, vi.fn());
    await limiter(
      {
        user: { userId: "user-1", organizationId: "org-1" },
        ip: "127.0.0.1",
      } as never,
      createResponse() as never,
      nextForFirstUser,
    );
    await limiter(
      {
        user: { userId: "user-2", organizationId: "org-1" },
        ip: "127.0.0.1",
      } as never,
      createResponse() as never,
      nextForSecondUser,
    );
    await limiter(
      {
        user: { userId: "user-1", organizationId: "org-2" },
        ip: "127.0.0.1",
      } as never,
      createResponse() as never,
      nextForSecondOrganization,
    );

    expect((nextForFirstUser.mock.calls[0][0] as AppError).statusCode).toBe(429);
    expect(nextForSecondUser).toHaveBeenCalledWith();
    expect(nextForSecondOrganization).toHaveBeenCalledWith();
  });
});
