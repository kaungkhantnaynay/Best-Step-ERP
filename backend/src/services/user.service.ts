import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { recordAuditLog } from "./audit.service.js";
import { AppError } from "../utils/app-error.js";
import type { AdminUserCreateInput } from "../validators/user.validators.js";

const passwordHashRounds = 12;

type AdminUserRecord = {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  createdAt: Date;
  userRoles: {
    role: {
      name: string;
    };
  }[];
};

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function toAdminUserResponse(user: AdminUserRecord) {
  return {
    id: user.id,
    organizationId: user.organizationId,
    email: user.email,
    name: user.name,
    roles: user.userRoles.map((userRole) => userRole.role.name),
    createdAt: user.createdAt.toISOString(),
  };
}

export async function createAdminUser(
  organizationId: string,
  input: AdminUserCreateInput,
  createdByUserId: string,
) {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    throw new AppError(409, "EMAIL_ALREADY_EXISTS", "Email is already registered");
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const adminRole = await tx.role.findUnique({
        where: {
          organizationId_name: {
            organizationId,
            name: "admin",
          },
        },
        select: {
          id: true,
        },
      });

      if (!adminRole) {
        throw new AppError(500, "ADMIN_ROLE_NOT_FOUND", "Admin role is not available for this organization");
      }

      const passwordHash = await bcrypt.hash(input.password, passwordHashRounds);
      const user = await tx.user.create({
        data: {
          organizationId,
          email: input.email,
          name: input.name,
          passwordHash,
          userRoles: {
            create: {
              roleId: adminRole.id,
            },
          },
        },
        include: {
          userRoles: {
            include: {
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      await recordAuditLog(
        {
          organizationId,
          userId: createdByUserId,
          action: "user.admin.create",
          entityType: "User",
          entityId: user.id,
          metadata: {
            email: user.email,
            role: "admin",
          },
        },
        tx,
      );

      return toAdminUserResponse(user);
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError(409, "EMAIL_ALREADY_EXISTS", "Email is already registered");
    }

    throw error;
  }
}
