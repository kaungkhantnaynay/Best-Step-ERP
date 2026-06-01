import { Router } from "express";
import {
  loginUser,
  logoutAllUserSessions,
  logoutUser,
  me,
  refreshSession,
  register,
} from "../controllers/auth.controller.js";
import { env } from "../config/env.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { rateLimit } from "../middlewares/rate-limit.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import { loginSchema, registerSchema } from "../validators/auth.validators.js";

export const authRouter = Router();

const authKey = (name: string) => (request: { ip?: string; body?: { email?: unknown } }) => {
  const email = typeof request.body?.email === "string" ? request.body.email.toLowerCase() : "unknown";

  return `${request.ip ?? "unknown"}:${name}:${email}`;
};

authRouter.post(
  "/register",
  rateLimit({
    name: "auth-register",
    windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
    maxRequests: env.AUTH_REGISTER_RATE_LIMIT_MAX_REQUESTS,
    keyGenerator: authKey("register"),
  }),
  validateRequest({ body: registerSchema }),
  register,
);

authRouter.post(
  "/login",
  rateLimit({
    name: "auth-login",
    windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
    maxRequests: env.AUTH_LOGIN_RATE_LIMIT_MAX_REQUESTS,
    keyGenerator: authKey("login"),
  }),
  validateRequest({ body: loginSchema }),
  loginUser,
);

authRouter.post(
  "/refresh",
  rateLimit({
    name: "auth-refresh",
    windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
    maxRequests: env.AUTH_REFRESH_RATE_LIMIT_MAX_REQUESTS,
    keyGenerator: (request) => request.ip ?? "unknown",
  }),
  refreshSession,
);

authRouter.post("/logout", logoutUser);
authRouter.post("/logout-all", requireAuth, logoutAllUserSessions);
authRouter.get("/me", requireAuth, me);
