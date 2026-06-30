import { Worker } from "bullmq";
import { env } from "../config/env.js";
import type { ReportJobData } from "./queues.js";
import { getDashboardAnalytics } from "../services/analytics.service.js";
import { prisma } from "../prisma/client.js";
import { logger } from "../utils/logger.js";

const connection = {
  url: env.REDIS_URL,
};

export const reportWorker = new Worker<ReportJobData>(
  "reports",
  async (job) => {
    if (job.name !== "dashboard-summary") {
      throw new Error(`Unknown report job: ${job.name}`);
    }

    const analytics = await getDashboardAnalytics(job.data.organizationId);
    await prisma.notification.create({
      data: {
        organizationId: job.data.organizationId,
        title: "Dashboard report ready",
        body: `Report generated with ${analytics.kpis.totalOrders} orders and ${analytics.kpis.lowStockItems} low-stock items.`,
      },
    });

    return {
      reportType: job.data.reportType,
      totalOrders: analytics.kpis.totalOrders,
      inventoryValue: analytics.kpis.inventoryValue,
      lowStockItems: analytics.kpis.lowStockItems,
    };
  },
  { connection },
);

reportWorker.on("completed", (job, result) => {
  logger.info({ jobId: job.id, jobName: job.name, result }, "Report job completed");
});

reportWorker.on("failed", (job, error) => {
  logger.error({ err: error, jobId: job?.id, jobName: job?.name }, "Report job failed");
});
