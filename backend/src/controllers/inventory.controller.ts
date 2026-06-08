import type {
  InventoryListQuery,
  StockMovementListQuery,
} from "../validators/inventory.validators.js";
import { AppError } from "../utils/app-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendCreated } from "../utils/responses.js";
import {
  listInventory,
  listStockMovements,
  stockIn,
  stockOut,
} from "../services/inventory.service.js";

function requireUser(request: { user?: { organizationId: string } }) {
  if (!request.user) throw new AppError(401, "AUTH_REQUIRED", "Authentication is required");

  return request.user;
}

export const listInventoryController = asyncHandler(async (request, response) => {
  const result = await listInventory(
    requireUser(request).organizationId,
    request.query as unknown as InventoryListQuery,
  );

  response.status(200).json({ data: result.inventory, pagination: result.pagination });
});

export const stockInController = asyncHandler(async (request, response) => {
  sendCreated(response, await stockIn(requireUser(request).organizationId, request.body));
});

export const stockOutController = asyncHandler(async (request, response) => {
  sendCreated(response, await stockOut(requireUser(request).organizationId, request.body));
});

export const listStockMovementsController = asyncHandler(async (request, response) => {
  const result = await listStockMovements(
    requireUser(request).organizationId,
    request.query as unknown as StockMovementListQuery,
  );

  response.status(200).json({ data: result.movements, pagination: result.pagination });
});
