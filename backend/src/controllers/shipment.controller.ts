import {
  addTrackingEvent,
  assignShipment,
  createShipment,
  getShipment,
  listShipments,
  updateShipmentStatus,
} from "../services/shipment.service.js";
import { AppError } from "../utils/app-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendCreated, sendOk } from "../utils/responses.js";
import type { ShipmentListQuery } from "../validators/shipment.validators.js";

function requireUser(request: { user?: { organizationId: string; userId: string } }) {
  if (!request.user) throw new AppError(401, "AUTH_REQUIRED", "Authentication is required");

  return request.user;
}

export const listShipmentsController = asyncHandler(async (request, response) => {
  const result = await listShipments(
    requireUser(request).organizationId,
    request.query as unknown as ShipmentListQuery,
  );

  response.status(200).json({ data: result.shipments, pagination: result.pagination });
});

export const createShipmentController = asyncHandler(async (request, response) => {
  const user = requireUser(request);
  sendCreated(response, await createShipment(user.organizationId, request.body, user.userId));
});

export const getShipmentController = asyncHandler(async (request, response) => {
  sendOk(response, await getShipment(requireUser(request).organizationId, request.params.id as string));
});

export const assignShipmentController = asyncHandler(async (request, response) => {
  const user = requireUser(request);
  sendOk(
    response,
    await assignShipment(user.organizationId, request.params.id as string, request.body, user.userId),
  );
});

export const updateShipmentStatusController = asyncHandler(async (request, response) => {
  const user = requireUser(request);
  sendOk(
    response,
    await updateShipmentStatus(user.organizationId, request.params.id as string, request.body, user.userId),
  );
});

export const addTrackingEventController = asyncHandler(async (request, response) => {
  const user = requireUser(request);
  sendCreated(
    response,
    await addTrackingEvent(user.organizationId, request.params.id as string, request.body, user.userId),
  );
});
