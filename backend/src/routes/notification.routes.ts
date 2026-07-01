import { Router } from "express";
import {
  listNotificationsController,
  markNotificationReadController,
} from "../controllers/notification.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { authenticatedRateLimit } from "../middlewares/rate-limit.middleware.js";
import { requirePermission } from "../middlewares/rbac.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import {
  notificationIdParamsSchema,
  notificationListQuerySchema,
} from "../validators/notification.validators.js";

export const notificationRouter = Router();

notificationRouter.use(requireAuth, authenticatedRateLimit);

notificationRouter.get(
  "/notifications",
  requirePermission("notifications.read"),
  validateRequest({ query: notificationListQuerySchema }),
  listNotificationsController,
);
notificationRouter.patch(
  "/notifications/:id/read",
  requirePermission("notifications.write"),
  validateRequest({ params: notificationIdParamsSchema }),
  markNotificationReadController,
);
