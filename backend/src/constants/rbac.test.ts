import { describe, expect, it } from "vitest";
import {
  defaultRoleNames,
  defaultRoleTemplates,
  permissionKeys,
} from "./rbac.js";

describe("rbac defaults", () => {
  it("defines the expected default organization roles", () => {
    expect(defaultRoleNames).toEqual(["owner", "admin", "manager", "staff"]);
  });

  it("grants every permission to owners", () => {
    expect(defaultRoleTemplates.owner).toEqual(permissionKeys);
  });

  it("keeps admin below owner by excluding audit read access", () => {
    expect(defaultRoleTemplates.admin).toContain("roles.manage");
    expect(defaultRoleTemplates.admin).not.toContain("audit.read");
  });

  it("keeps staff read-oriented", () => {
    expect(defaultRoleTemplates.staff).toEqual([
      "auth.me",
      "products.read",
      "warehouses.read",
      "inventory.read",
      "orders.read",
      "shipments.read",
      "notifications.read",
    ]);
  });
});
