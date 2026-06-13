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

function requireUser(request: { user?: { organizationId: string; userId: string } }) {
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
  const user = requireUser(request);
  sendCreated(response, await createProduct(user.organizationId, request.body, user.userId));
});

export const getProductController = asyncHandler(async (request, response) => {
  sendOk(response, await getProduct(requireUser(request).organizationId, request.params.id as string));
});

export const updateProductController = asyncHandler(async (request, response) => {
  const user = requireUser(request);
  sendOk(
    response,
    await updateProduct(user.organizationId, request.params.id as string, request.body, user.userId),
  );
});

export const archiveProductController = asyncHandler(async (request, response) => {
  const user = requireUser(request);
  sendOk(response, await archiveProduct(user.organizationId, request.params.id as string, user.userId));
});

export const listCategoriesController = asyncHandler(async (request, response) => {
  sendOk(response, await listCategories(requireUser(request).organizationId));
});

export const createCategoryController = asyncHandler(async (request, response) => {
  const user = requireUser(request);
  sendCreated(response, await createCategory(user.organizationId, request.body, user.userId));
});
