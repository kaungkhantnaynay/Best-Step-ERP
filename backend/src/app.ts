import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/error.middleware.js";
import { requestLogger } from "./middlewares/logging.middleware.js";
import { requestContext } from "./middlewares/request-context.middleware.js";
import { healthRouter } from "./routes/health.routes.js";
import { openApiDocument } from "./utils/openapi.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(requestContext);
app.use(requestLogger);
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1", healthRouter);
app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.get("/api/v1/openapi.json", (_request, response) => {
  response.json(openApiDocument);
});

app.use(notFoundHandler);
app.use(errorHandler);
