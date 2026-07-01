import { Redis } from "ioredis";
import type { Request, RequestHandler } from "express";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";
import { logger } from "../utils/logger.js";

type RateLimitStoreResult = {
  count: number;
  resetAt: Date;
};

type RateLimitStore = {
  increment(key: string, windowMs: number): Promise<RateLimitStoreResult>;
};

type RateLimitOptions = {
  name: string;
  windowMs?: number;
  maxRequests?: number;
  keyGenerator?: (request: Request) => string;
  store?: RateLimitStore;
};

class MemoryRateLimitStore implements RateLimitStore {
  private readonly buckets = new Map<string, { count: number; resetAt: number }>();

  async increment(key: string, windowMs: number) {
    const now = Date.now();
    const existing = this.buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      const resetAt = now + windowMs;
      this.buckets.set(key, { count: 1, resetAt });

      return {
        count: 1,
        resetAt: new Date(resetAt),
      };
    }

    existing.count += 1;

    return {
      count: existing.count,
      resetAt: new Date(existing.resetAt),
    };
  }
}

class RedisRateLimitStore implements RateLimitStore {
  private readonly memoryFallback = new MemoryRateLimitStore();
  private readonly redis: Redis;
  private fallbackLogged = false;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });

    this.redis.on("error", (error: Error) => {
      if (!this.fallbackLogged) {
        logger.warn({ err: error }, "Redis rate limit store unavailable; using memory fallback");
        this.fallbackLogged = true;
      }
    });
  }

  async increment(key: string, windowMs: number) {
    try {
      if (this.redis.status === "wait") {
        await this.redis.connect();
      }

      const count = await this.redis.incr(key);

      if (count === 1) {
        await this.redis.pexpire(key, windowMs);
      }

      const ttl = await this.redis.pttl(key);
      const resetAt = new Date(Date.now() + Math.max(ttl, windowMs));

      return { count, resetAt };
    } catch (error) {
      if (!this.fallbackLogged) {
        logger.warn({ err: error }, "Redis rate limit increment failed; using memory fallback");
        this.fallbackLogged = true;
      }

      return this.memoryFallback.increment(key, windowMs);
    }
  }
}

const defaultMemoryStore = new MemoryRateLimitStore();
const defaultRedisStore =
  env.NODE_ENV === "test" ? defaultMemoryStore : new RedisRateLimitStore(env.REDIS_URL);

function defaultKeyGenerator(request: Request) {
  const tenantPart = request.user?.organizationId ?? "anonymous";
  const userPart = request.user?.userId ?? request.ip ?? "unknown";

  return `${tenantPart}:${userPart}`;
}

export const authenticatedRateLimit = rateLimit({
  name: "authenticated-api",
  windowMs: env.AUTHENTICATED_RATE_LIMIT_WINDOW_MS,
  maxRequests: env.AUTHENTICATED_RATE_LIMIT_MAX_REQUESTS,
});

export const sensitiveMutationRateLimit = rateLimit({
  name: "sensitive-mutation",
  windowMs: env.SENSITIVE_MUTATION_RATE_LIMIT_WINDOW_MS,
  maxRequests: env.SENSITIVE_MUTATION_RATE_LIMIT_MAX_REQUESTS,
});

export const reportGenerationRateLimit = rateLimit({
  name: "report-generation",
  windowMs: env.REPORT_RATE_LIMIT_WINDOW_MS,
  maxRequests: env.REPORT_RATE_LIMIT_MAX_REQUESTS,
});

export function rateLimit(options: RateLimitOptions): RequestHandler {
  const windowMs = options.windowMs ?? env.RATE_LIMIT_WINDOW_MS;
  const maxRequests = options.maxRequests ?? env.RATE_LIMIT_MAX_REQUESTS;
  const store = options.store ?? defaultRedisStore;
  const keyGenerator = options.keyGenerator ?? defaultKeyGenerator;

  return async (request, response, next) => {
    const key = `rate-limit:${options.name}:${keyGenerator(request)}`;
    const result = await store.increment(key, windowMs);
    const remaining = Math.max(maxRequests - result.count, 0);
    const retryAfter = Math.max(Math.ceil((result.resetAt.getTime() - Date.now()) / 1000), 1);

    request.rateLimit = {
      limit: maxRequests,
      remaining,
      resetAt: result.resetAt,
    };

    response.setHeader("RateLimit-Limit", maxRequests);
    response.setHeader("RateLimit-Remaining", remaining);
    response.setHeader("RateLimit-Reset", Math.ceil(result.resetAt.getTime() / 1000));

    if (result.count > maxRequests) {
      response.setHeader("Retry-After", retryAfter);
      logger.warn(
        {
          requestId: request.requestId,
          userId: request.user?.userId,
          organizationId: request.user?.organizationId,
          rateLimitName: options.name,
        },
        "Rate limit exceeded",
      );

      next(
        new AppError(429, "RATE_LIMITED", "Too many requests", {
          retryAfter,
        }),
      );
      return;
    }

    next();
  };
}

export function createMemoryRateLimitStore() {
  return new MemoryRateLimitStore();
}
