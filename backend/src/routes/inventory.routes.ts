import { Router } from "express";
import {
  listInventoryController,
  listStockMovementsController,
  stockInController,
  stockOutController,
} from "../controllers/inventory.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/rbac.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import {
  inventoryListQuerySchema,
  stockMovementListQuerySchema,
  stockMutationSchema,
} from "../validators/inventory.validators.js";

export const inventoryRouter = Router();

inventoryRouter.use(requireAuth);

inventoryRouter.get(
  "/inventory",
  requirePermission("inventory.read"),
  validateRequest({ query: inventoryListQuerySchema }),
  listInventoryController,
);
inventoryRouter.post(
  "/inventory/stock-in",
  requirePermission("inventory.write"),
  validateRequest({ body: stockMutationSchema }),
  stockInController,
);
inventoryRouter.post(
  "/inventory/stock-out",
  requirePermission("inventory.write"),
  validateRequest({ body: stockMutationSchema }),
  stockOutController,
);
inventoryRouter.get(
  "/stock-movements",
  requirePermission("inventory.read"),
  validateRequest({ query: stockMovementListQuerySchema }),
  listStockMovementsController,
);
