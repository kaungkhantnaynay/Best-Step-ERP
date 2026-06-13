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

      expect(source, `${fileName} must apply requireAuth at router level`).toContain(".use(requireAuth)");

      for (const call of routeCalls(source)) {
        expect(call, `${fileName} route is missing requirePermission`).toContain("requirePermission(");
      }
    }
  });

  it("keeps auth public routes explicit and protects account routes", () => {
    const source = readFileSync(join(routesDir, "auth.routes.ts"), "utf8");

    for (const expectation of authRouteExpectations) {
      const call = routeCalls(source).find((routeCall) => routeCall.includes(`"${expectation.route}"`));

      expect(call, `Missing auth route ${expectation.route}`).toBeDefined();

      if (expectation.requiresAuth) {
        expect(call, `${expectation.route} must require auth`).toContain("requireAuth");
      } else {
        expect(call, `${expectation.route} should stay public by design`).not.toContain("requireAuth");
      }
    }
  });
});
