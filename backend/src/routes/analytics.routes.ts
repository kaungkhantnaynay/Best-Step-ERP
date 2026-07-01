import { Router } from "express";
import {
  enqueueDashboardReportController,
  getDashboardAnalyticsController,
} from "../controllers/analytics.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  authenticatedRateLimit,
  reportGenerationRateLimit,
} from "../middlewares/rate-limit.middleware.js";
import { requirePermission } from "../middlewares/rbac.middleware.js";

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth, authenticatedRateLimit);

analyticsRouter.get(
  "/analytics/dashboard",
  requirePermission("analytics.read"),
  getDashboardAnalyticsController,
);

analyticsRouter.post(
  "/analytics/reports/dashboard",
  requirePermission("analytics.read"),
  reportGenerationRateLimit,
  enqueueDashboardReportController,
);
