import { Router } from "express";
import { getDashboardAnalyticsController } from "../controllers/analytics.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/rbac.middleware.js";

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth);

analyticsRouter.get(
  "/analytics/dashboard",
  requirePermission("analytics.read"),
  getDashboardAnalyticsController,
);
