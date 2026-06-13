import { listAuditLogs } from "../services/audit.service.js";
import { AppError } from "../utils/app-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import type { AuditLogListQuery } from "../validators/audit.validators.js";

function requireUser(request: { user?: { organizationId: string } }) {
  if (!request.user) throw new AppError(401, "AUTH_REQUIRED", "Authentication is required");

  return request.user;
}

export const listAuditLogsController = asyncHandler(async (request, response) => {
  const result = await listAuditLogs(
    requireUser(request).organizationId,
    request.query as unknown as AuditLogListQuery,
  );

  response.status(200).json({ data: result.auditLogs, pagination: result.pagination });
});
