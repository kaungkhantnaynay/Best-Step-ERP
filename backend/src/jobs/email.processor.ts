import { Worker } from "bullmq";
import { env } from "../config/env.js";
import type { EmailJobData } from "./queues.js";
import { logger } from "../utils/logger.js";

const connection = {
  url: env.REDIS_URL,
};

export const emailWorker = new Worker<EmailJobData>(
  "emails",
  async (job) => {
    if (job.name !== "send-email") {
      throw new Error(`Unknown email job: ${job.name}`);
    }

    logger.info(
      {
        organizationId: job.data.organizationId,
        to: job.data.to,
        subject: job.data.subject,
      },
      "Email job accepted; configure an email provider to deliver messages",
    );

    return { delivered: false, providerConfigured: false };
  },
  { connection },
);

emailWorker.on("completed", (job, result) => {
  logger.info({ jobId: job.id, jobName: job.name, result }, "Email job completed");
});

emailWorker.on("failed", (job, error) => {
  logger.error({ err: error, jobId: job?.id, jobName: job?.name }, "Email job failed");
});
