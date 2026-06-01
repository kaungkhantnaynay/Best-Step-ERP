export const openApiDocument = {
  openapi: "3.0.0",
  info: {
    title: "Best Step ERP API",
    version: "0.1.0",
  },
  components: {
    schemas: {
      ErrorResponse: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message"],
            properties: {
              code: { type: "string" },
              message: { type: "string" },
              requestId: { type: "string" },
            },
          },
        },
      },
      ValidationErrorResponse: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message", "details"],
            properties: {
              code: { type: "string", example: "VALIDATION_ERROR" },
              message: { type: "string" },
              details: { type: "array", items: { type: "object" } },
              requestId: { type: "string" },
            },
          },
        },
      },
      RateLimitErrorResponse: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message", "retryAfter"],
            properties: {
              code: { type: "string", example: "RATE_LIMITED" },
              message: { type: "string" },
              retryAfter: { type: "integer" },
              requestId: { type: "string" },
            },
          },
        },
      },
    },
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
