import type { NotificationListQuery } from "../validators/notification.validators.js";
import {
  listNotifications,
  markNotificationRead,
} from "../services/notification.service.js";
import { AppError } from "../utils/app-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendOk } from "../utils/responses.js";

function requireUser(request: { user?: { organizationId: string } }) {
  if (!request.user) throw new AppError(401, "AUTH_REQUIRED", "Authentication is required");

  return request.user;
}

export const listNotificationsController = asyncHandler(async (request, response) => {
  const result = await listNotifications(
    requireUser(request).organizationId,
    request.query as unknown as NotificationListQuery,
  );

  response.status(200).json({ data: result.notifications, pagination: result.pagination });
});

export const markNotificationReadController = asyncHandler(async (request, response) => {
  sendOk(
    response,
    await markNotificationRead(requireUser(request).organizationId, request.params.id as string),
  );
});
