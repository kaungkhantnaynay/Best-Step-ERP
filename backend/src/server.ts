import { app } from "./app.js";
import { env } from "./config/env.js";
import { scheduleAuthMaintenanceJobs } from "./jobs/queues.js";
import { logger } from "./utils/logger.js";

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "Best Step API listening");

  void scheduleAuthMaintenanceJobs().catch((error: unknown) => {
    logger.warn({ err: error }, "Failed to schedule auth maintenance jobs");
  });
});
