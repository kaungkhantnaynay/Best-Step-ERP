import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { auditRouter } from "./routes/audit.routes.js";
import { env } from "./config/env.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/error.middleware.js";
import { requestLogger } from "./middlewares/logging.middleware.js";
import { requestContext } from "./middlewares/request-context.middleware.js";
import { analyticsRouter } from "./routes/analytics.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { inventoryRouter } from "./routes/inventory.routes.js";
import { notificationRouter } from "./routes/notification.routes.js";
import { orderRouter } from "./routes/order.routes.js";
import { productRouter } from "./routes/product.routes.js";
import { shipmentRouter } from "./routes/shipment.routes.js";
import { warehouseRouter } from "./routes/warehouse.routes.js";
import { openApiDocument } from "./utils/openapi.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(requestContext);
app.use(requestLogger);
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1", healthRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1", productRouter);
app.use("/api/v1", warehouseRouter);
app.use("/api/v1", inventoryRouter);
app.use("/api/v1", orderRouter);
app.use("/api/v1", shipmentRouter);
app.use("/api/v1", analyticsRouter);
app.use("/api/v1", notificationRouter);
app.use("/api/v1", auditRouter);
app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.get("/api/v1/openapi.json", (_request, response) => {
  response.json(openApiDocument);
});

app.use(notFoundHandler);
app.use(errorHandler);
