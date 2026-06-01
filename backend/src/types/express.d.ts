import type { AuthContext } from "./request.js";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: AuthContext;
      rateLimit?: {
        limit: number;
        remaining: number;
        resetAt: Date;
      };
    }
  }
}

export {};
