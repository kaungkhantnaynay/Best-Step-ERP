import { getDashboardAnalytics } from "../services/analytics.service.js";
import { enqueueReportJob } from "../jobs/queues.js";
import { AppError } from "../utils/app-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendOk } from "../utils/responses.js";

function requireUser(request: { user?: { userId: string; organizationId: string } }) {
  if (!request.user) throw new AppError(401, "AUTH_REQUIRED", "Authentication is required");

  return request.user;
}

export const getDashboardAnalyticsController = asyncHandler(async (request, response) => {
  sendOk(response, await getDashboardAnalytics(requireUser(request).organizationId));
});

export const enqueueDashboardReportController = asyncHandler(async (request, response) => {
  const user = requireUser(request);
  const job = await enqueueReportJob({
    organizationId: user.organizationId,
    requestedByUserId: user.userId,
    reportType: "dashboard-summary",
  });

  response.status(202).json({
    data: {
      jobId: job.id,
      reportType: "dashboard-summary",
      status: "queued",
    },
  });
});
