import type { Prisma } from "@prisma/client";
import {
  defaultRoleTemplates,
  permissionCatalog,
  permissionKeys,
} from "../constants/rbac.js";
import { AppError } from "../utils/app-error.js";

export async function upsertPermissionCatalog(tx: Prisma.TransactionClient) {
  for (const [key, description] of permissionCatalog) {
    await tx.permission.upsert({
      where: { key },
      update: { description },
      create: { key, description },
    });
  }
}

export async function createDefaultRolesForOrganization(
  tx: Prisma.TransactionClient,
  organizationId: string,
) {
  const permissions = await tx.permission.findMany({
    where: {
      key: {
        in: permissionKeys,
      },
    },
  });
  const permissionByKey = new Map(permissions.map((permission) => [permission.key, permission.id]));

  if (permissionByKey.size !== permissionKeys.length) {
    throw new AppError(500, "AUTH_PERMISSIONS_NOT_SEEDED", "Auth permissions have not been seeded");
  }

  const roles = new Map<string, string>();

  for (const [roleName, rolePermissionKeys] of Object.entries(defaultRoleTemplates)) {
    const role = await tx.role.upsert({
      where: {
        organizationId_name: {
          organizationId,
          name: roleName,
        },
      },
      update: {},
      create: {
        organizationId,
        name: roleName,
      },
    });

    for (const permissionKey of rolePermissionKeys) {
      await tx.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permissionByKey.get(permissionKey)!,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permissionByKey.get(permissionKey)!,
        },
      });
    }

    roles.set(role.name, role.id);
  }

  return roles;
}
