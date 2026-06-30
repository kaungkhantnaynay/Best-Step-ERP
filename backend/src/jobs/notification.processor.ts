import { Worker } from "bullmq";
import { env } from "../config/env.js";
import { enqueueEmailJob, type NotificationJobData } from "./queues.js";
import { prisma } from "../prisma/client.js";
import { logger } from "../utils/logger.js";

const connection = {
  url: env.REDIS_URL,
};

export const notificationWorker = new Worker<NotificationJobData>(
  "notifications",
  async (job) => {
    if (job.name !== "create-notification") {
      throw new Error(`Unknown notification job: ${job.name}`);
    }

    const notification = await prisma.notification.create({
      data: {
        organizationId: job.data.organizationId,
        title: job.data.title,
        body: job.data.body,
      },
    });

    const recipients = await prisma.user.findMany({
      where: {
        organizationId: job.data.organizationId,
        userRoles: {
          some: {
            role: {
              name: { in: ["owner", "admin"] },
            },
          },
        },
      },
      select: {
        email: true,
      },
    });

    await Promise.all(
      recipients.map((recipient) =>
        enqueueEmailJob({
          organizationId: job.data.organizationId,
          to: recipient.email,
          subject: job.data.title,
          text: job.data.body,
        }),
      ),
    );

    return notification;
  },
  { connection },
);

notificationWorker.on("completed", (job) => {
  logger.info({ jobId: job.id, jobName: job.name }, "Notification job completed");
});

notificationWorker.on("failed", (job, error) => {
  logger.error({ err: error, jobId: job?.id, jobName: job?.name }, "Notification job failed");
});
