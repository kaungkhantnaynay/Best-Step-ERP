import { Router } from "express";
import {
  createWarehouseBinController,
  createWarehouseController,
  getWarehouseController,
  listWarehousesController,
} from "../controllers/warehouse.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/rbac.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import {
  warehouseBinCreateSchema,
  warehouseCreateSchema,
  warehouseIdParamsSchema,
  warehouseListQuerySchema,
} from "../validators/warehouse.validators.js";

export const warehouseRouter = Router();

warehouseRouter.use(requireAuth);

warehouseRouter.get(
  "/warehouses",
  requirePermission("warehouses.read"),
  validateRequest({ query: warehouseListQuerySchema }),
  listWarehousesController,
);
warehouseRouter.post(
  "/warehouses",
  requirePermission("warehouses.write"),
  validateRequest({ body: warehouseCreateSchema }),
  createWarehouseController,
);
warehouseRouter.get(
  "/warehouses/:id",
  requirePermission("warehouses.read"),
  validateRequest({ params: warehouseIdParamsSchema }),
  getWarehouseController,
);
warehouseRouter.post(
  "/warehouses/:id/bins",
  requirePermission("warehouses.write"),
  validateRequest({ params: warehouseIdParamsSchema, body: warehouseBinCreateSchema }),
  createWarehouseBinController,
);
