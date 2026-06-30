import { Queue, type JobsOptions } from "bullmq";
import { env } from "../config/env.js";

const connection = {
  url: env.REDIS_URL,
};

const defaultJobOptions: JobsOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 5_000,
  },
  removeOnComplete: true,
  removeOnFail: 100,
};

export type NotificationJobData = {
  organizationId: string;
  title: string;
  body: string;
};

export type EmailJobData = {
  organizationId?: string;
  to: string;
  subject: string;
  text: string;
};

export type ReportJobData = {
  organizationId: string;
  requestedByUserId?: string;
  reportType: "dashboard-summary";
};

export const notificationQueue = new Queue("notifications", { connection });
export const emailQueue = new Queue("emails", { connection });
export const reportQueue = new Queue("reports", { connection });
export const authMaintenanceQueue = new Queue("auth-maintenance", { connection });

export async function enqueueNotificationJob(data: NotificationJobData, options?: JobsOptions) {
  return notificationQueue.add("create-notification", data, { ...defaultJobOptions, ...options });
}

export async function enqueueEmailJob(data: EmailJobData, options?: JobsOptions) {
  return emailQueue.add("send-email", data, { ...defaultJobOptions, ...options });
}

export async function enqueueReportJob(data: ReportJobData, options?: JobsOptions) {
  return reportQueue.add(data.reportType, data, { ...defaultJobOptions, ...options });
}

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
