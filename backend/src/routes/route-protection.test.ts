import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

const routesDir = dirname(fileURLToPath(import.meta.url));

const protectedRouteFiles = [
  "analytics.routes.ts",
  "audit.routes.ts",
  "inventory.routes.ts",
  "notification.routes.ts",
  "order.routes.ts",
  "product.routes.ts",
  "shipment.routes.ts",
  "user.routes.ts",
  "warehouse.routes.ts",
];

const authRouteExpectations = [
  { route: "/logout-all", requiresAuth: true },
  { route: "/me", requiresAuth: true },
  { route: "/register", requiresAuth: false },
  { route: "/login", requiresAuth: false },
  { route: "/refresh", requiresAuth: false },
  { route: "/logout", requiresAuth: false },
];

function routeCalls(source: string) {
  return [...source.matchAll(/\w+Router\.(get|post|patch|delete)\([\s\S]*?\);/g)].map((match) => match[0]);
}

describe("route protection", () => {
  it("protects tenant-owned routers with auth and explicit permissions", () => {
    for (const fileName of protectedRouteFiles) {
      const source = readFileSync(join(routesDir, fileName), "utf8");

      expect(source, `${fileName} must apply requireAuth and authenticated rate limiting at router level`).toContain(
        ".use(requireAuth, authenticatedRateLimit)",
      );
      expect(source, `${fileName} must import authenticatedRateLimit`).toContain("authenticatedRateLimit");

      for (const call of routeCalls(source)) {
        expect(call, `${fileName} route is missing requirePermission`).toContain("requirePermission(");
      }
    }
  });

  it("applies stricter limits to abuse-prone authenticated actions", () => {
    const expectations = [
      {
        fileName: "analytics.routes.ts",
        method: "post",
        route: "/analytics/reports/dashboard",
        limiter: "reportGenerationRateLimit",
      },
      { fileName: "inventory.routes.ts", method: "post", route: "/inventory/stock-in", limiter: "sensitiveMutationRateLimit" },
      { fileName: "inventory.routes.ts", method: "post", route: "/inventory/stock-out", limiter: "sensitiveMutationRateLimit" },
      { fileName: "order.routes.ts", method: "post", route: "/orders", limiter: "sensitiveMutationRateLimit" },
      { fileName: "order.routes.ts", method: "patch", route: "/orders/:id/status", limiter: "sensitiveMutationRateLimit" },
      { fileName: "order.routes.ts", method: "post", route: "/orders/:id/cancel", limiter: "sensitiveMutationRateLimit" },
      { fileName: "user.routes.ts", method: "post", route: "/users/admin", limiter: "sensitiveMutationRateLimit" },
      { fileName: "warehouse.routes.ts", method: "post", route: "/warehouse-transfers", limiter: "sensitiveMutationRateLimit" },
    ];

    for (const expectation of expectations) {
      const source = readFileSync(join(routesDir, expectation.fileName), "utf8");
      const call = routeCalls(source).find(
        (routeCall) => routeCall.includes(`.${expectation.method}(`) && routeCall.includes(`"${expectation.route}"`),
      );

      expect(call, `Missing route ${expectation.route} in ${expectation.fileName}`).toBeDefined();
      expect(call, `${expectation.route} must apply ${expectation.limiter}`).toContain(expectation.limiter);
    }
  });

  it("keeps auth public routes explicit and protects account routes", () => {
    const source = readFileSync(join(routesDir, "auth.routes.ts"), "utf8");

    for (const expectation of authRouteExpectations) {
      const call = routeCalls(source).find((routeCall) => routeCall.includes(`"${expectation.route}"`));

      expect(call, `Missing auth route ${expectation.route}`).toBeDefined();

      if (expectation.requiresAuth) {
        expect(call, `${expectation.route} must require auth`).toContain("requireAuth");
        expect(call, `${expectation.route} must apply authenticated rate limiting`).toContain("authenticatedRateLimit");
      } else {
        expect(call, `${expectation.route} should stay public by design`).not.toContain("requireAuth");
      }
    }
  });
});
