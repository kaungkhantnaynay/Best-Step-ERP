import { Router } from "express";
import { createAdminUserController } from "../controllers/user.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/rbac.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import { adminUserCreateSchema } from "../validators/user.validators.js";

export const userRouter = Router();

userRouter.use(requireAuth);

userRouter.post(
  "/users/admin",
  requirePermission("users.admin.create"),
  validateRequest({ body: adminUserCreateSchema }),
  createAdminUserController,
);
