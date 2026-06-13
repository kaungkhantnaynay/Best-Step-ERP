import bcrypt from "bcryptjs";
import { createHmac, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";
import { env } from "../config/env.js";
import { prisma } from "../prisma/client.js";
import { recordAuditLog } from "./audit.service.js";
import { createDefaultRolesForOrganization } from "./rbac.service.js";
import type { AccessTokenPayload, RefreshTokenPayload } from "../types/request.js";
import { AppError } from "../utils/app-error.js";
import { logger } from "../utils/logger.js";
import type { LoginInput, RegisterInput } from "../validators/auth.validators.js";

const passwordHashRounds = 12;

type AuthUserRecord = {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  organization: {
    name: string;
  };
  userRoles: {
    role: {
      name: string;
      rolePermissions: {
        permission: {
          key: string;
        };
      }[];
    };
  }[];
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  organizationName: string;
  roles: string[];
  permissions: string[];
};

export type AuthResult = {
  accessToken: string;
  refreshToken: string;
  refreshTokenMaxAgeMs: number;
  user: AuthUser;
};

type RefreshSession = {
  rawToken: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
  maxAgeMs: number;
};

export type RefreshTokenMetadata = {
  userAgent?: string;
  ipAddress?: string;
};

function requireAccessSecret() {
  if (!env.JWT_ACCESS_SECRET) {
    throw new AppError(500, "AUTH_NOT_CONFIGURED", "Access token signing is not configured");
  }

  return env.JWT_ACCESS_SECRET;
}

function requireRefreshSecret() {
  if (!env.JWT_REFRESH_SECRET) {
    throw new AppError(500, "AUTH_NOT_CONFIGURED", "Refresh token signing is not configured");
  }

  return env.JWT_REFRESH_SECRET;
}

export function parseDurationMs(duration: string) {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(duration);

  if (!match) {
    throw new AppError(500, "AUTH_NOT_CONFIGURED", "Token expiry duration is invalid");
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers = {
    ms: 1,
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  } as const;

  return amount * multipliers[unit as keyof typeof multipliers];
}

function signAccessToken(userId: string, organizationId: string) {
  return jwt.sign(
    { sub: userId, organizationId, type: "access" } satisfies AccessTokenPayload,
    requireAccessSecret(),
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"] },
  );
}

function hashRefreshToken(rawToken: string) {
  return createHmac("sha256", requireRefreshSecret()).update(rawToken).digest("hex");
}

function hashIpAddress(ipAddress: string | undefined) {
  if (!ipAddress) {
    return undefined;
  }

  return createHmac("sha256", requireRefreshSecret()).update(ipAddress).digest("hex");
}

function createRefreshSession(userId: string, organizationId: string, familyId: string = randomUUID()): RefreshSession {
  const maxAgeMs = parseDurationMs(env.JWT_REFRESH_EXPIRES_IN);
  const expiresAt = new Date(Date.now() + maxAgeMs);
  const rawToken = jwt.sign(
    { sub: userId, organizationId, familyId, jti: randomUUID(), type: "refresh" } satisfies RefreshTokenPayload,
    requireRefreshSecret(),
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"] },
  );

  return {
    rawToken,
    tokenHash: hashRefreshToken(rawToken),
    familyId,
    expiresAt,
    maxAgeMs,
  };
}

function isRefreshTokenPayload(payload: string | jwt.JwtPayload): payload is RefreshTokenPayload {
  return (
    typeof payload !== "string" &&
    typeof payload.sub === "string" &&
    typeof payload.organizationId === "string" &&
    typeof payload.familyId === "string" &&
    typeof payload.jti === "string" &&
    payload.type === "refresh"
  );
}

function toAuthUser(user: AuthUserRecord): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    organizationId: user.organizationId,
    organizationName: user.organization.name,
    roles: user.userRoles.map((userRole) => userRole.role.name),
    permissions: [
      ...new Set(
        user.userRoles.flatMap((userRole) =>
          userRole.role.rolePermissions.map((rolePermission) => rolePermission.permission.key),
        ),
      ),
    ],
  };
}

function createAuthResult(user: AuthUserRecord, refreshSession: RefreshSession): AuthResult {
  return {
    accessToken: signAccessToken(user.id, user.organizationId),
    refreshToken: refreshSession.rawToken,
    refreshTokenMaxAgeMs: refreshSession.maxAgeMs,
    user: toAuthUser(user),
  };
}

function refreshTokenCreateData(
  userId: string,
  organizationId: string,
  refreshSession: RefreshSession,
  metadata?: RefreshTokenMetadata,
) {
  return {
    organizationId,
    userId,
    familyId: refreshSession.familyId,
    tokenHash: refreshSession.tokenHash,
    expiresAt: refreshSession.expiresAt,
    userAgent: metadata?.userAgent,
    ipAddressHash: hashIpAddress(metadata?.ipAddress),
  };
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function getAuthUser(userId: string, organizationId: string) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      organizationId,
    },
    include: {
      organization: true,
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new AppError(401, "INVALID_TOKEN", "Access token subject was not found");
  }

  return user as AuthUserRecord;
}

export async function registerOwner(input: RegisterInput, metadata?: RefreshTokenMetadata): Promise<AuthResult> {
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

  const existingOrganization = await prisma.organization.findUnique({
    where: {
      slug: input.organizationSlug,
    },
    select: {
      id: true,
    },
  });

  if (existingOrganization) {
    throw new AppError(409, "ORGANIZATION_SLUG_ALREADY_EXISTS", "Organization slug is already in use");
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: input.organizationName,
          slug: input.organizationSlug,
        },
      });
      const roles = await createDefaultRolesForOrganization(tx, organization.id);
      const passwordHash = await bcrypt.hash(input.password, passwordHashRounds);
      const user = await tx.user.create({
        data: {
          organizationId: organization.id,
          email: input.email,
          name: input.name,
          passwordHash,
        },
        include: {
          organization: true,
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      const ownerRoleId = roles.get("owner");

      if (!ownerRoleId) {
        throw new AppError(500, "AUTH_OWNER_ROLE_NOT_CREATED", "Owner role was not created");
      }

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: ownerRoleId,
        },
      });

      const userWithRoles = await tx.user.findFirstOrThrow({
        where: {
          id: user.id,
          organizationId: organization.id,
        },
        include: {
          organization: true,
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      const refreshSession = createRefreshSession(user.id, organization.id);

      await tx.refreshToken.create({
        data: refreshTokenCreateData(user.id, organization.id, refreshSession, metadata),
      });

      await recordAuditLog(
        {
          organizationId: organization.id,
          userId: user.id,
          action: "auth.register",
          entityType: "User",
          entityId: user.id,
          metadata: {
            email: user.email,
            organizationSlug: organization.slug,
          },
        },
        tx,
      );

      return createAuthResult(userWithRoles as AuthUserRecord, refreshSession);
    }, { timeout: 15_000 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError(409, "AUTH_UNIQUE_CONSTRAINT", "Email or organization slug already exists");
    }

    throw error;
  }
}

export async function login(input: LoginInput, metadata?: RefreshTokenMetadata): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
    include: {
      organization: true,
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
  }

  const refreshSession = createRefreshSession(user.id, user.organizationId);

  await prisma.refreshToken.create({
    data: {
      ...refreshTokenCreateData(user.id, user.organizationId, refreshSession, metadata),
      lastUsedAt: new Date(),
    },
  });

  await recordAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "auth.login",
    entityType: "User",
    entityId: user.id,
    metadata: {
      email: user.email,
    },
  });

  return createAuthResult(user as AuthUserRecord, refreshSession);
}

export async function refresh(rawRefreshToken: string, metadata?: RefreshTokenMetadata): Promise<AuthResult> {
  let payload: string | jwt.JwtPayload;

  try {
    payload = jwt.verify(rawRefreshToken, requireRefreshSecret());
  } catch {
    logger.warn("Refresh token verification failed");
    throw new AppError(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired");
  }

  if (!isRefreshTokenPayload(payload)) {
    logger.warn("Refresh token payload was invalid");
    throw new AppError(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid");
  }

  const tokenHash = hashRefreshToken(rawRefreshToken);
  const storedToken = await prisma.refreshToken.findUnique({
    where: {
      tokenHash,
    },
  });

  if (!storedToken) {
    logger.warn(
      {
        userId: payload.sub,
        organizationId: payload.organizationId,
        familyId: payload.familyId,
      },
      "Refresh token hash was not found",
    );
    throw new AppError(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid");
  }

  if (storedToken.familyId !== payload.familyId || storedToken.userId !== payload.sub) {
    await prisma.refreshToken.updateMany({
      where: {
        familyId: storedToken.familyId,
      },
      data: {
        revokedAt: new Date(),
        revokedReason: "token_payload_mismatch",
      },
    });

    await recordAuditLog({
      organizationId: storedToken.organizationId,
      userId: storedToken.userId,
      action: "auth.refresh_reuse_detected",
      entityType: "RefreshTokenFamily",
      entityId: storedToken.familyId,
      metadata: {
        reason: "token_payload_mismatch",
      },
    });

    logger.warn(
      {
        userId: storedToken.userId,
        organizationId: storedToken.organizationId,
        familyId: storedToken.familyId,
      },
      "Refresh token payload mismatch detected; family revoked",
    );
    throw new AppError(401, "REFRESH_TOKEN_REUSED", "Refresh token reuse was detected");
  }

  if (storedToken.revokedAt || storedToken.replacedByTokenId) {
    await prisma.refreshToken.updateMany({
      where: {
        familyId: storedToken.familyId,
      },
      data: {
        revokedAt: new Date(),
        revokedReason: "token_reuse_detected",
      },
    });

    await recordAuditLog({
      organizationId: storedToken.organizationId,
      userId: storedToken.userId,
      action: "auth.refresh_reuse_detected",
      entityType: "RefreshTokenFamily",
      entityId: storedToken.familyId,
      metadata: {
        reason: "token_reuse_detected",
      },
    });

    logger.warn(
      {
        userId: storedToken.userId,
        organizationId: storedToken.organizationId,
        familyId: storedToken.familyId,
      },
      "Refresh token reuse detected; family revoked",
    );
    throw new AppError(401, "REFRESH_TOKEN_REUSED", "Refresh token reuse was detected");
  }

  if (storedToken.expiresAt <= new Date()) {
    await prisma.refreshToken.update({
      where: {
        id: storedToken.id,
      },
      data: {
        revokedAt: new Date(),
        revokedReason: "expired",
      },
    });

    logger.info(
      {
        userId: storedToken.userId,
        organizationId: storedToken.organizationId,
        familyId: storedToken.familyId,
      },
      "Expired refresh token revoked",
    );
    throw new AppError(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired");
  }

  const user = await getAuthUser(storedToken.userId, storedToken.organizationId);
  const refreshSession = createRefreshSession(user.id, user.organizationId, storedToken.familyId);

  await prisma.$transaction(async (tx) => {
    const replacement = await tx.refreshToken.create({
      data: {
        ...refreshTokenCreateData(user.id, user.organizationId, refreshSession, metadata),
        lastUsedAt: new Date(),
      },
    });

    await tx.refreshToken.update({
      where: {
        id: storedToken.id,
      },
      data: {
        revokedAt: new Date(),
        revokedReason: "rotated",
        replacedByTokenId: replacement.id,
        lastUsedAt: new Date(),
      },
    });
  });

  return createAuthResult(user, refreshSession);
}

export async function logout(rawRefreshToken: string | undefined) {
  if (!rawRefreshToken) {
    return;
  }

  let payload: string | jwt.JwtPayload;

  try {
    payload = jwt.verify(rawRefreshToken, requireRefreshSecret());
  } catch {
    return;
  }

  if (!isRefreshTokenPayload(payload)) {
    return;
  }

  await prisma.refreshToken.updateMany({
    where: {
      tokenHash: hashRefreshToken(rawRefreshToken),
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
      revokedReason: "logout",
    },
  });

  await recordAuditLog({
    organizationId: payload.organizationId,
    userId: payload.sub,
    action: "auth.logout",
    entityType: "User",
    entityId: payload.sub,
  });

  logger.info("Refresh token revoked for logout");
}

export async function logoutAll(userId: string, organizationId: string) {
  const result = await prisma.refreshToken.updateMany({
    where: {
      userId,
      organizationId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
      revokedReason: "logout_all",
    },
  });

  logger.info(
    {
      userId,
      organizationId,
      revokedCount: result.count,
    },
    "All refresh tokens revoked for user",
  );

  await recordAuditLog({
    organizationId,
    userId,
    action: "auth.logout_all",
    entityType: "User",
    entityId: userId,
    metadata: {
      revokedCount: result.count,
    },
  });

  return result.count;
}

export async function cleanupExpiredRefreshTokens(retentionDays = 30) {
  const now = new Date();
  const revokedBefore = new Date(now.getTime() - retentionDays * 86_400_000);
  const result = await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        {
          expiresAt: {
            lt: now,
          },
        },
        {
          revokedAt: {
            lt: revokedBefore,
          },
        },
      ],
    },
  });

  logger.info(
    {
      deletedCount: result.count,
      retentionDays,
    },
    "Expired and old revoked refresh tokens cleaned up",
  );

  return result.count;
}

export async function getCurrentUser(userId: string, organizationId: string) {
  return toAuthUser(await getAuthUser(userId, organizationId));
}
