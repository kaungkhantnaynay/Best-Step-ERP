import { Worker } from "bullmq";
import { env } from "../config/env.js";
import { cleanupExpiredRefreshTokens } from "../services/auth.service.js";
import { logger } from "../utils/logger.js";

const connection = {
  url: env.REDIS_URL,
};

export const authMaintenanceWorker = new Worker(
  "auth-maintenance",
  async (job) => {
    if (job.name === "refresh-token-cleanup") {
      return {
        deletedCount: await cleanupExpiredRefreshTokens(env.AUTH_REFRESH_TOKEN_CLEANUP_RETENTION_DAYS),
      };
    }

    throw new Error(`Unknown auth maintenance job: ${job.name}`);
  },
  { connection },
);

authMaintenanceWorker.on("completed", (job, result) => {
  logger.info(
    {
      jobId: job.id,
      jobName: job.name,
      result,
    },
    "Auth maintenance job completed",
  );
});

authMaintenanceWorker.on("failed", (job, error) => {
  logger.error(
    {
      err: error,
      jobId: job?.id,
      jobName: job?.name,
    },
    "Auth maintenance job failed",
  );
});
