import { Router } from "express";
import { listAuditLogsController } from "../controllers/audit.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/rbac.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import { auditLogListQuerySchema } from "../validators/audit.validators.js";

export const auditRouter = Router();

auditRouter.use(requireAuth);

auditRouter.get(
  "/audit-logs",
  requirePermission("audit.read"),
  validateRequest({ query: auditLogListQuerySchema }),
  listAuditLogsController,
);
