import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.string().default("info"),
  REQUEST_ID_HEADER: z.string().default("x-request-id"),
  DATABASE_URL: z.string().optional(),
  DIRECT_DATABASE_URL: z.string().optional(),
  POOLED_DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  JWT_ACCESS_SECRET: z.string().optional(),
  JWT_REFRESH_SECRET: z.string().optional(),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  REFRESH_TOKEN_COOKIE_NAME: z.string().default("best_step_refresh"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(120),
  AUTHENTICATED_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  AUTHENTICATED_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(120),
  SENSITIVE_MUTATION_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  SENSITIVE_MUTATION_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(20),
  REPORT_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  REPORT_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(5),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  AUTH_LOGIN_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(10),
  AUTH_REGISTER_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(5),
  AUTH_REFRESH_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(30),
  AUTH_REFRESH_TOKEN_CLEANUP_CRON: z.string().default("0 3 * * *"),
  AUTH_REFRESH_TOKEN_CLEANUP_RETENTION_DAYS: z.coerce.number().int().positive().default(30),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
});

export const env = envSchema.parse(process.env);
