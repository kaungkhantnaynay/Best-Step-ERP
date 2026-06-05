import type { ProductListQuery } from "../validators/product.validators.js";
import { AppError } from "../utils/app-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendCreated, sendOk } from "../utils/responses.js";
import {
  archiveProduct,
  createCategory,
  createProduct,
  getProduct,
  listCategories,
  listProducts,
  updateProduct,
} from "../services/product.service.js";

function requireUser(request: { user?: { organizationId: string } }) {
  if (!request.user) throw new AppError(401, "AUTH_REQUIRED", "Authentication is required");

  return request.user;
}

export const listProductsController = asyncHandler(async (request, response) => {
  const result = await listProducts(
    requireUser(request).organizationId,
    request.query as unknown as ProductListQuery,
  );

  response.status(200).json({ data: result.products, pagination: result.pagination });
});

export const createProductController = asyncHandler(async (request, response) => {
  sendCreated(response, await createProduct(requireUser(request).organizationId, request.body));
});

export const getProductController = asyncHandler(async (request, response) => {
  sendOk(response, await getProduct(requireUser(request).organizationId, request.params.id as string));
});

export const updateProductController = asyncHandler(async (request, response) => {
  sendOk(
    response,
    await updateProduct(requireUser(request).organizationId, request.params.id as string, request.body),
  );
});

export const archiveProductController = asyncHandler(async (request, response) => {
  sendOk(response, await archiveProduct(requireUser(request).organizationId, request.params.id as string));
});

export const listCategoriesController = asyncHandler(async (request, response) => {
  sendOk(response, await listCategories(requireUser(request).organizationId));
});

export const createCategoryController = asyncHandler(async (request, response) => {
  sendCreated(response, await createCategory(requireUser(request).organizationId, request.body));
});
