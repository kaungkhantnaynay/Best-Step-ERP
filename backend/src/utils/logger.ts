import pino from "pino";
import { env } from "../config/env.js";

const redactPaths = [
  "req.headers.authorization",
  "req.headers.cookie",
  "req.body.password",
  "req.body.passwordHash",
  "req.body.accessToken",
  "req.body.refreshToken",
  "req.body.token",
  "req.cookies",
  "res.headers.set-cookie",
  "*.password",
  "*.passwordHash",
  "*.accessToken",
  "*.refreshToken",
  "*.token",
  "*.apiKey",
  "*.secret",
];

export const logger = pino({
  level: env.NODE_ENV === "test" ? "silent" : env.LOG_LEVEL,
  redact: {
    paths: redactPaths,
    censor: "[redacted]",
  },
});
