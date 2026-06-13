import { getDashboardAnalytics } from "../services/analytics.service.js";
import { AppError } from "../utils/app-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendOk } from "../utils/responses.js";

function requireUser(request: { user?: { organizationId: string } }) {
  if (!request.user) throw new AppError(401, "AUTH_REQUIRED", "Authentication is required");

  return request.user;
}

export const getDashboardAnalyticsController = asyncHandler(async (request, response) => {
  sendOk(response, await getDashboardAnalytics(requireUser(request).organizationId));
});
