import { describe, expect, it } from "vitest";
import { adminUserCreateSchema } from "./user.validators.js";

describe("user validators", () => {
  it("normalizes admin email and trims names", () => {
    const result = adminUserCreateSchema.parse({
      name: "  Operations Admin  ",
      email: "ADMIN@EXAMPLE.COM",
      password: "Password1",
    });

    expect(result).toEqual({
      name: "Operations Admin",
      email: "admin@example.com",
      password: "Password1",
    });
  });

  it("requires admin passwords to match registration strength", () => {
    expect(() =>
      adminUserCreateSchema.parse({
        name: "Operations Admin",
        email: "admin@example.com",
        password: "password",
      }),
    ).toThrow();
  });
});
