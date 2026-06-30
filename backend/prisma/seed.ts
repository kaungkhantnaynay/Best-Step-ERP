import { prisma } from "../src/prisma/client.js";
import {
  createDefaultRolesForOrganization,
  upsertPermissionCatalog,
} from "../src/services/rbac.service.js";

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
  }, { timeout: 30_000 });
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
