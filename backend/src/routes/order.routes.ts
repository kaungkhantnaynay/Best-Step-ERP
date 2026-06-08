import { Router } from "express";
import {
  cancelOrderController,
  createOrderController,
  getOrderController,
  listOrdersController,
  updateOrderStatusController,
} from "../controllers/order.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/rbac.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import {
  orderCreateSchema,
  orderIdParamsSchema,
  orderListQuerySchema,
  orderStatusUpdateSchema,
} from "../validators/order.validators.js";

export const orderRouter = Router();

orderRouter.use(requireAuth);

orderRouter.get(
  "/orders",
  requirePermission("orders.read"),
  validateRequest({ query: orderListQuerySchema }),
  listOrdersController,
);
orderRouter.post(
  "/orders",
  requirePermission("orders.write"),
  validateRequest({ body: orderCreateSchema }),
  createOrderController,
);
orderRouter.get(
  "/orders/:id",
  requirePermission("orders.read"),
  validateRequest({ params: orderIdParamsSchema }),
  getOrderController,
);
orderRouter.patch(
  "/orders/:id/status",
  requirePermission("orders.write"),
  validateRequest({ params: orderIdParamsSchema, body: orderStatusUpdateSchema }),
  updateOrderStatusController,
);
orderRouter.post(
  "/orders/:id/cancel",
  requirePermission("orders.write"),
  validateRequest({ params: orderIdParamsSchema }),
  cancelOrderController,
);
