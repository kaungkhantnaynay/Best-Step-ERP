import { describe, expect, it, vi } from "vitest";
import { permissionCatalog } from "../constants/rbac.js";
import {
  createDefaultRolesForOrganization,
  upsertPermissionCatalog,
} from "./rbac.service.js";

describe("rbac service", () => {
  it("upserts the full permission catalog", async () => {
    const tx = {
      permission: {
        upsert: vi.fn().mockResolvedValue({}),
      },
    };

    await upsertPermissionCatalog(tx as never);

    expect(tx.permission.upsert).toHaveBeenCalledTimes(permissionCatalog.length);
    expect(tx.permission.upsert).toHaveBeenCalledWith({
      where: { key: "auth.me" },
      update: { description: "Read the current authenticated user context" },
      create: { key: "auth.me", description: "Read the current authenticated user context" },
    });
  });

  it("creates default organization roles and role permissions idempotently", async () => {
    const tx = {
      permission: {
        findMany: vi.fn().mockResolvedValue(
          permissionCatalog.map(([key]) => ({
            id: `permission-${key}`,
            key,
          })),
        ),
      },
      role: {
        upsert: vi
          .fn()
          .mockImplementation(({ where }) =>
            Promise.resolve({
              id: `role-${where.organizationId_name.name}`,
              name: where.organizationId_name.name,
            }),
          ),
      },
      rolePermission: {
        createMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    };

    const roles = await createDefaultRolesForOrganization(tx as never, "org-1");

    expect(roles.get("owner")).toBe("role-owner");
    expect(tx.role.upsert).toHaveBeenCalledTimes(4);
    expect(tx.role.upsert).toHaveBeenCalledWith({
      where: {
        organizationId_name: {
          organizationId: "org-1",
          name: "owner",
        },
      },
      update: {},
      create: {
        organizationId: "org-1",
        name: "owner",
      },
    });
    expect(tx.rolePermission.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        {
          roleId: "role-owner",
          permissionId: "permission-auth.me",
        },
      ]),
      skipDuplicates: true,
    });
  });
});
