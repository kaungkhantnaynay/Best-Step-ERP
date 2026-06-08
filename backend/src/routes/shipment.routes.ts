import { Router } from "express";
import {
  addTrackingEventController,
  assignShipmentController,
  createShipmentController,
  getShipmentController,
  listShipmentsController,
  updateShipmentStatusController,
} from "../controllers/shipment.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/rbac.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import {
  shipmentAssignSchema,
  shipmentCreateSchema,
  shipmentIdParamsSchema,
  shipmentListQuerySchema,
  shipmentStatusUpdateSchema,
  trackingEventCreateSchema,
} from "../validators/shipment.validators.js";

export const shipmentRouter = Router();

shipmentRouter.use(requireAuth);

shipmentRouter.get(
  "/shipments",
  requirePermission("shipments.read"),
  validateRequest({ query: shipmentListQuerySchema }),
  listShipmentsController,
);
shipmentRouter.post(
  "/shipments",
  requirePermission("shipments.write"),
  validateRequest({ body: shipmentCreateSchema }),
  createShipmentController,
);
shipmentRouter.get(
  "/shipments/:id",
  requirePermission("shipments.read"),
  validateRequest({ params: shipmentIdParamsSchema }),
  getShipmentController,
);
shipmentRouter.patch(
  "/shipments/:id/assign",
  requirePermission("shipments.write"),
  validateRequest({ params: shipmentIdParamsSchema, body: shipmentAssignSchema }),
  assignShipmentController,
);
shipmentRouter.patch(
  "/shipments/:id/status",
  requirePermission("shipments.write"),
  validateRequest({ params: shipmentIdParamsSchema, body: shipmentStatusUpdateSchema }),
  updateShipmentStatusController,
);
shipmentRouter.post(
  "/shipments/:id/tracking-events",
  requirePermission("shipments.write"),
  validateRequest({ params: shipmentIdParamsSchema, body: trackingEventCreateSchema }),
  addTrackingEventController,
);
