export const openApiDocument = {
  openapi: "3.0.0",
  info: {
    title: "Best Step ERP API",
    version: "0.1.0",
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
      refreshCookie: {
        type: "apiKey",
        in: "cookie",
        name: "best_step_refresh",
      },
    },
    schemas: {
      AuthUser: {
        type: "object",
        required: ["id", "email", "name", "organizationId", "organizationName", "roles", "permissions"],
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          name: { type: "string" },
          organizationId: { type: "string", format: "uuid" },
          organizationName: { type: "string" },
          roles: { type: "array", items: { type: "string" } },
          permissions: { type: "array", items: { type: "string" } },
        },
      },
      AuthResponse: {
        type: "object",
        required: ["data"],
        properties: {
          data: {
            type: "object",
            required: ["accessToken", "user"],
            properties: {
              accessToken: { type: "string" },
              user: { $ref: "#/components/schemas/AuthUser" },
            },
          },
        },
      },
      MeResponse: {
        type: "object",
        required: ["data"],
        properties: {
          data: {
            type: "object",
            required: ["user"],
            properties: {
              user: { $ref: "#/components/schemas/AuthUser" },
            },
          },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["organizationName", "organizationSlug", "name", "email", "password"],
        properties: {
          organizationName: { type: "string", minLength: 2, maxLength: 120, example: "Best Step Logistics" },
          organizationSlug: {
            type: "string",
            minLength: 3,
            maxLength: 64,
            pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
            example: "best-step-logistics",
          },
          name: { type: "string", minLength: 2, maxLength: 120, example: "Kaung Khant Nay" },
          email: { type: "string", format: "email", maxLength: 254, example: "owner@example.com" },
          password: {
            type: "string",
            format: "password",
            minLength: 8,
            maxLength: 128,
            description: "Must include lowercase, uppercase, and numeric characters.",
          },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", maxLength: 254, example: "owner@example.com" },
          password: { type: "string", format: "password", minLength: 1, maxLength: 128 },
        },
      },
      SuccessResponse: {
        type: "object",
        required: ["data"],
        properties: {
          data: {
            type: "object",
            required: ["success"],
            properties: {
              success: { type: "boolean", example: true },
            },
          },
        },
      },
      LogoutAllResponse: {
        type: "object",
        required: ["data"],
        properties: {
          data: {
            type: "object",
            required: ["success", "revokedCount"],
            properties: {
              success: { type: "boolean", example: true },
              revokedCount: { type: "integer", minimum: 0 },
            },
          },
        },
      },
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
              details: {
                type: "object",
                required: ["retryAfter"],
                properties: {
                  retryAfter: { type: "integer" },
                },
              },
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
    "/api/v1/auth/register": {
      post: {
        summary: "Register an organization owner",
        description: "Rate limited by AUTH_REGISTER_RATE_LIMIT_MAX_REQUESTS per AUTH_RATE_LIMIT_WINDOW_MS.",
        "x-rateLimit": {
          windowMsEnv: "AUTH_RATE_LIMIT_WINDOW_MS",
          maxRequestsEnv: "AUTH_REGISTER_RATE_LIMIT_MAX_REQUESTS",
        },
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Organization owner registered",
            headers: {
              "Set-Cookie": {
                description: "HttpOnly refresh token cookie",
                schema: { type: "string" },
              },
            },
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          "400": {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
              },
            },
          },
          "409": {
            description: "Email or organization slug already exists",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "429": {
            description: "Rate limited",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RateLimitErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/login": {
      post: {
        summary: "Log in",
        description: "Rate limited by AUTH_LOGIN_RATE_LIMIT_MAX_REQUESTS per AUTH_RATE_LIMIT_WINDOW_MS.",
        "x-rateLimit": {
          windowMsEnv: "AUTH_RATE_LIMIT_WINDOW_MS",
          maxRequestsEnv: "AUTH_LOGIN_RATE_LIMIT_MAX_REQUESTS",
        },
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Authenticated",
            headers: {
              "Set-Cookie": {
                description: "HttpOnly refresh token cookie",
                schema: { type: "string" },
              },
            },
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          "400": {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
              },
            },
          },
          "401": {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "429": {
            description: "Rate limited",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RateLimitErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/refresh": {
      post: {
        summary: "Rotate refresh token and issue a new access token",
        description: "Rate limited by AUTH_REFRESH_RATE_LIMIT_MAX_REQUESTS per AUTH_RATE_LIMIT_WINDOW_MS.",
        security: [{ refreshCookie: [] }],
        "x-rateLimit": {
          windowMsEnv: "AUTH_RATE_LIMIT_WINDOW_MS",
          maxRequestsEnv: "AUTH_REFRESH_RATE_LIMIT_MAX_REQUESTS",
        },
        responses: {
          "200": {
            description: "Session refreshed",
            headers: {
              "Set-Cookie": {
                description: "Rotated HttpOnly refresh token cookie",
                schema: { type: "string" },
              },
            },
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          "401": {
            description: "Missing, invalid, expired, or reused refresh token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "429": {
            description: "Rate limited",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RateLimitErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/logout": {
      post: {
        summary: "Log out current refresh-token session",
        security: [{ refreshCookie: [] }],
        responses: {
          "200": {
            description: "Logged out",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/logout-all": {
      post: {
        summary: "Revoke all refresh-token sessions for the current user",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "All sessions revoked",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LogoutAllResponse" },
              },
            },
          },
          "401": {
            description: "Authentication required or invalid token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/me": {
      get: {
        summary: "Get current authenticated user context",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Current authenticated user",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MeResponse" },
              },
            },
          },
          "401": {
            description: "Authentication required or invalid token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
  },
};
