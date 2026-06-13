import type { WarehouseListQuery } from "../validators/warehouse.validators.js";
import { AppError } from "../utils/app-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendCreated, sendOk } from "../utils/responses.js";
import {
  createWarehouse,
  createWarehouseBin,
  getWarehouse,
  listWarehouses,
  transferWarehouseStock,
} from "../services/warehouse.service.js";

function requireUser(request: { user?: { organizationId: string; userId: string } }) {
  if (!request.user) throw new AppError(401, "AUTH_REQUIRED", "Authentication is required");

  return request.user;
}

export const listWarehousesController = asyncHandler(async (request, response) => {
  const result = await listWarehouses(
    requireUser(request).organizationId,
    request.query as unknown as WarehouseListQuery,
  );

  response.status(200).json({ data: result.warehouses, pagination: result.pagination });
});

export const createWarehouseController = asyncHandler(async (request, response) => {
  const user = requireUser(request);
  sendCreated(response, await createWarehouse(user.organizationId, request.body, user.userId));
});

export const getWarehouseController = asyncHandler(async (request, response) => {
  sendOk(response, await getWarehouse(requireUser(request).organizationId, request.params.id as string));
});

export const createWarehouseBinController = asyncHandler(async (request, response) => {
  const user = requireUser(request);
  sendCreated(
    response,
    await createWarehouseBin(user.organizationId, request.params.id as string, request.body, user.userId),
  );
});

export const transferWarehouseStockController = asyncHandler(async (request, response) => {
  const user = requireUser(request);
  sendCreated(response, await transferWarehouseStock(user.organizationId, request.body, user.userId));
});
