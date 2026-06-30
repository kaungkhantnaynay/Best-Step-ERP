import { createAdminUser } from "../services/user.service.js";
import { AppError } from "../utils/app-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendCreated } from "../utils/responses.js";

function requireUser(request: { user?: { organizationId: string; userId: string } }) {
  if (!request.user) throw new AppError(401, "AUTH_REQUIRED", "Authentication is required");

  return request.user;
}

export const createAdminUserController = asyncHandler(async (request, response) => {
  const user = requireUser(request);

  sendCreated(response, await createAdminUser(user.organizationId, request.body, user.userId));
});
