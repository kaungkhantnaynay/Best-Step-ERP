import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/error.middleware.js";
import { healthRouter } from "./routes/health.routes.js";

const openApiDocument = {
  openapi: "3.0.0",
  info: {
    title: "Best Step ERP API",
    version: "0.1.0",
  },
  paths: {
    "/api/v1/health": {
      get: {
        summary: "Health check",
        responses: {
          "200": {
            description: "API is healthy",
          },
        },
      },
    },
  },
};

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.use("/api/v1", healthRouter);
app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.get("/api/v1/openapi.json", (_request, response) => {
  response.json(openApiDocument);
});

app.use(notFoundHandler);
app.use(errorHandler);
