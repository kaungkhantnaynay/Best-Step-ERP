import { Router } from "express";
import {
  archiveProductController,
  createCategoryController,
  createProductController,
  getProductController,
  listCategoriesController,
  listProductsController,
  updateProductController,
} from "../controllers/product.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { authenticatedRateLimit } from "../middlewares/rate-limit.middleware.js";
import { requirePermission } from "../middlewares/rbac.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import {
  categoryCreateSchema,
  productCreateSchema,
  productIdParamsSchema,
  productListQuerySchema,
  productUpdateSchema,
} from "../validators/product.validators.js";

export const productRouter = Router();

productRouter.use(requireAuth, authenticatedRateLimit);

productRouter.get(
  "/products",
  requirePermission("products.read"),
  validateRequest({ query: productListQuerySchema }),
  listProductsController,
);
productRouter.post(
  "/products",
  requirePermission("products.write"),
  validateRequest({ body: productCreateSchema }),
  createProductController,
);
productRouter.get(
  "/products/:id",
  requirePermission("products.read"),
  validateRequest({ params: productIdParamsSchema }),
  getProductController,
);
productRouter.patch(
  "/products/:id",
  requirePermission("products.write"),
  validateRequest({ params: productIdParamsSchema, body: productUpdateSchema }),
  updateProductController,
);
productRouter.delete(
  "/products/:id",
  requirePermission("products.delete"),
  validateRequest({ params: productIdParamsSchema }),
  archiveProductController,
);
productRouter.get("/categories", requirePermission("products.read"), listCategoriesController);
productRouter.post(
  "/categories",
  requirePermission("products.write"),
  validateRequest({ body: categoryCreateSchema }),
  createCategoryController,
);
