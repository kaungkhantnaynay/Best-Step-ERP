import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./auth.validators.js";

describe("auth validators", () => {
  it("normalizes register email and organization slug", () => {
    const result = registerSchema.parse({
      organizationName: "Best Step Logistics",
      organizationSlug: "Best-Step",
      name: "Owner User",
      email: "OWNER@EXAMPLE.COM",
      password: "Password1",
    });

    expect(result).toMatchObject({
      organizationSlug: "best-step",
      email: "owner@example.com",
    });
  });

  it("rejects invalid organization slugs", () => {
    expect(() =>
      registerSchema.parse({
        organizationName: "Best Step Logistics",
        organizationSlug: "best_step",
        name: "Owner User",
        email: "owner@example.com",
        password: "Password1",
      }),
    ).toThrow();
  });

  it("rejects weak registration passwords", () => {
    expect(() =>
      registerSchema.parse({
        organizationName: "Best Step Logistics",
        organizationSlug: "best-step",
        name: "Owner User",
        email: "owner@example.com",
        password: "password",
      }),
    ).toThrow();
  });

  it("normalizes login email and requires a password", () => {
    expect(
      loginSchema.parse({
        email: "OWNER@EXAMPLE.COM",
        password: "Password1",
      }),
    ).toEqual({
      email: "owner@example.com",
      password: "Password1",
    });

    expect(() =>
      loginSchema.parse({
        email: "owner@example.com",
        password: "",
      }),
    ).toThrow();
  });
});
