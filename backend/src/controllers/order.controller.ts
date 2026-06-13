import type { OrderListQuery } from "../validators/order.validators.js";
import { AppError } from "../utils/app-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendCreated, sendOk } from "../utils/responses.js";
import {
  cancelOrder,
  createOrder,
  getOrder,
  listOrders,
  updateOrderStatus,
} from "../services/order.service.js";

function requireUser(request: { user?: { organizationId: string; userId: string } }) {
  if (!request.user) throw new AppError(401, "AUTH_REQUIRED", "Authentication is required");

  return request.user;
}

export const listOrdersController = asyncHandler(async (request, response) => {
  const result = await listOrders(
    requireUser(request).organizationId,
    request.query as unknown as OrderListQuery,
  );

  response.status(200).json({ data: result.orders, pagination: result.pagination });
});

export const createOrderController = asyncHandler(async (request, response) => {
  const user = requireUser(request);
  sendCreated(response, await createOrder(user.organizationId, request.body, user.userId));
});

export const getOrderController = asyncHandler(async (request, response) => {
  sendOk(response, await getOrder(requireUser(request).organizationId, request.params.id as string));
});

export const updateOrderStatusController = asyncHandler(async (request, response) => {
  const user = requireUser(request);
  sendOk(
    response,
    await updateOrderStatus(user.organizationId, request.params.id as string, request.body, user.userId),
  );
});

export const cancelOrderController = asyncHandler(async (request, response) => {
  const user = requireUser(request);
  sendOk(response, await cancelOrder(user.organizationId, request.params.id as string, user.userId));
});
