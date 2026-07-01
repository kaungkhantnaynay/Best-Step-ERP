import { Router } from "express";
import {
  listInventoryController,
  listStockMovementsController,
  stockInController,
  stockOutController,
} from "../controllers/inventory.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  authenticatedRateLimit,
  sensitiveMutationRateLimit,
} from "../middlewares/rate-limit.middleware.js";
import { requirePermission } from "../middlewares/rbac.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import {
  inventoryListQuerySchema,
  stockMovementListQuerySchema,
  stockMutationSchema,
} from "../validators/inventory.validators.js";

export const inventoryRouter = Router();

inventoryRouter.use(requireAuth, authenticatedRateLimit);

inventoryRouter.get(
  "/inventory",
  requirePermission("inventory.read"),
  validateRequest({ query: inventoryListQuerySchema }),
  listInventoryController,
);
inventoryRouter.post(
  "/inventory/stock-in",
  requirePermission("inventory.write"),
  sensitiveMutationRateLimit,
  validateRequest({ body: stockMutationSchema }),
  stockInController,
);
inventoryRouter.post(
  "/inventory/stock-out",
  requirePermission("inventory.write"),
  sensitiveMutationRateLimit,
  validateRequest({ body: stockMutationSchema }),
  stockOutController,
);
inventoryRouter.get(
  "/stock-movements",
  requirePermission("inventory.read"),
  validateRequest({ query: stockMovementListQuerySchema }),
  listStockMovementsController,
);
