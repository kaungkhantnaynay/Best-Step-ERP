import { Queue } from "bullmq";
import { env } from "../config/env.js";

const connection = {
  url: env.REDIS_URL,
};

export const notificationQueue = new Queue("notifications", { connection });
export const reportQueue = new Queue("reports", { connection });
export const authMaintenanceQueue = new Queue("auth-maintenance", { connection });

export async function scheduleAuthMaintenanceJobs() {
  await authMaintenanceQueue.add(
    "refresh-token-cleanup",
    {},
    {
      jobId: "refresh-token-cleanup",
      repeat: {
        pattern: env.AUTH_REFRESH_TOKEN_CLEANUP_CRON,
      },
      removeOnComplete: true,
      removeOnFail: 100,
    },
  );
}
