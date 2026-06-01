import { PrismaClient } from "@prisma/client";
import {
  createDefaultRolesForOrganization,
  upsertPermissionCatalog,
} from "../src/services/rbac.service.js";

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction(async (tx) => {
    await upsertPermissionCatalog(tx);

    const organizations = await tx.organization.findMany({
      select: {
        id: true,
      },
    });

    for (const organization of organizations) {
      await createDefaultRolesForOrganization(tx, organization.id);
    }
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
