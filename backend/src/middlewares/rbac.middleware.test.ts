import { describe, expect, it, vi } from "vitest";
import { AppError } from "../utils/app-error.js";
import { requirePermission } from "./rbac.middleware.js";

describe("requirePermission", () => {
  it("allows requests with the required permission", () => {
    const next = vi.fn();

    requirePermission("products.read")(
      {
        user: {
          userId: "user-1",
          organizationId: "org-1",
          roles: ["staff"],
          permissions: ["products.read"],
        },
      } as never,
      {} as never,
      next,
    );

    expect(next).toHaveBeenCalledWith();
  });

  it("denies requests without the required permission", () => {
    const next = vi.fn();

    requirePermission("products.write")(
      {
        requestId: "req-1",
        user: {
          userId: "user-1",
          organizationId: "org-1",
          roles: ["staff"],
          permissions: ["products.read"],
        },
      } as never,
      {} as never,
      next,
    );

    const error = next.mock.calls[0][0] as AppError;
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe("PERMISSION_DENIED");
  });
});
