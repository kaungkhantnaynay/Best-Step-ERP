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
      PaginationMeta: {
        type: "object",
        required: ["page", "limit", "total", "totalPages"],
        properties: {
          page: { type: "integer", minimum: 1 },
          limit: { type: "integer", minimum: 1, maximum: 100 },
          total: { type: "integer", minimum: 0 },
          totalPages: { type: "integer", minimum: 0 },
        },
      },
      Product: {
        type: "object",
        required: ["id", "sku", "name", "unit", "price", "reorderLevel", "status", "stockQuantity", "stockStatus", "inventoryValue", "locationSummary", "createdAt", "updatedAt"],
        properties: {
          id: { type: "string", format: "uuid" },
          sku: { type: "string" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          unit: { type: "string" },
          price: { type: "number", minimum: 0 },
          reorderLevel: { type: "integer", minimum: 0 },
          status: { type: "string", enum: ["ACTIVE", "ARCHIVED"] },
          category: {
            nullable: true,
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              name: { type: "string" },
            },
          },
          stockQuantity: { type: "integer", minimum: 0 },
          stockStatus: { type: "string", enum: ["Active", "Low stock", "Archived"] },
          inventoryValue: { type: "number", minimum: 0 },
          locationSummary: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ProductRequest: {
        type: "object",
        required: ["name", "unit", "price", "reorderLevel"],
        properties: {
          name: { type: "string", minLength: 2, maxLength: 160 },
          sku: { type: "string", minLength: 3, maxLength: 64 },
          description: { type: "string", nullable: true, maxLength: 1000 },
          categoryId: { type: "string", format: "uuid", nullable: true },
          unit: { type: "string", minLength: 1, maxLength: 40 },
          price: { type: "number", minimum: 0 },
          reorderLevel: { type: "integer", minimum: 0 },
          status: { type: "string", enum: ["ACTIVE", "ARCHIVED"] },
        },
      },
      ProductListResponse: {
        type: "object",
        required: ["data", "pagination"],
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/Product" } },
          pagination: { $ref: "#/components/schemas/PaginationMeta" },
        },
      },
      ProductResponse: {
        type: "object",
        required: ["data"],
        properties: {
          data: { $ref: "#/components/schemas/Product" },
        },
      },
      Category: {
        type: "object",
        required: ["id", "name", "createdAt", "updatedAt"],
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CategoryRequest: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", minLength: 2, maxLength: 120 },
        },
      },
      CategoryListResponse: {
        type: "object",
        required: ["data"],
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/Category" } },
        },
      },
      CategoryResponse: {
        type: "object",
        required: ["data"],
        properties: {
          data: { $ref: "#/components/schemas/Category" },
        },
      },
      WarehouseBin: {
        type: "object",
        required: ["id", "code", "totalQuantity", "createdAt", "updatedAt"],
        properties: {
          id: { type: "string", format: "uuid" },
          code: { type: "string" },
          totalQuantity: { type: "integer", minimum: 0 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Warehouse: {
        type: "object",
        required: ["id", "name", "code", "binsCount", "totalQuantity", "bins", "createdAt", "updatedAt"],
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          code: { type: "string" },
          address: { type: "string", nullable: true },
          binsCount: { type: "integer", minimum: 0 },
          totalQuantity: { type: "integer", minimum: 0 },
          bins: { type: "array", items: { $ref: "#/components/schemas/WarehouseBin" } },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      WarehouseRequest: {
        type: "object",
        required: ["name", "code"],
        properties: {
          name: { type: "string", minLength: 2, maxLength: 160 },
          code: {
            type: "string",
            minLength: 2,
            maxLength: 32,
            pattern: "^[A-Z0-9][A-Z0-9-]*$",
          },
          address: { type: "string", nullable: true, maxLength: 500 },
        },
      },
      WarehouseBinRequest: {
        type: "object",
        required: ["code"],
        properties: {
          code: {
            type: "string",
            minLength: 2,
            maxLength: 32,
            pattern: "^[A-Z0-9][A-Z0-9-]*$",
          },
        },
      },
      WarehouseListResponse: {
        type: "object",
        required: ["data", "pagination"],
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/Warehouse" } },
          pagination: { $ref: "#/components/schemas/PaginationMeta" },
        },
      },
      WarehouseResponse: {
        type: "object",
        required: ["data"],
        properties: {
          data: { $ref: "#/components/schemas/Warehouse" },
        },
      },
      WarehouseBinResponse: {
        type: "object",
        required: ["data"],
        properties: {
          data: { $ref: "#/components/schemas/WarehouseBin" },
        },
      },
      InventoryItem: {
        type: "object",
        required: [
          "id",
          "product",
          "warehouse",
          "bin",
          "quantity",
          "productTotalQuantity",
          "reorderLevel",
          "risk",
          "inventoryValue",
          "updatedAt",
        ],
        properties: {
          id: { type: "string", format: "uuid" },
          product: {
            type: "object",
            required: ["id", "sku", "name", "unit"],
            properties: {
              id: { type: "string", format: "uuid" },
              sku: { type: "string" },
              name: { type: "string" },
              unit: { type: "string" },
            },
          },
          warehouse: {
            type: "object",
            required: ["id", "code", "name"],
            properties: {
              id: { type: "string", format: "uuid" },
              code: { type: "string" },
              name: { type: "string" },
            },
          },
          bin: {
            type: "object",
            required: ["id", "code"],
            properties: {
              id: { type: "string", format: "uuid" },
              code: { type: "string" },
            },
          },
          quantity: { type: "integer", minimum: 0 },
          productTotalQuantity: { type: "integer", minimum: 0 },
          reorderLevel: { type: "integer", minimum: 0 },
          risk: { type: "string", enum: ["Healthy", "Watch", "Low", "Critical"] },
          inventoryValue: { type: "number", minimum: 0 },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      InventoryListResponse: {
        type: "object",
        required: ["data", "pagination"],
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/InventoryItem" } },
          pagination: { $ref: "#/components/schemas/PaginationMeta" },
        },
      },
      InventoryResponse: {
        type: "object",
        required: ["data"],
        properties: {
          data: { $ref: "#/components/schemas/InventoryItem" },
        },
      },
      StockMutationRequest: {
        type: "object",
        required: ["productId", "binId", "quantity"],
        properties: {
          productId: { type: "string", format: "uuid" },
          binId: { type: "string", format: "uuid" },
          quantity: { type: "integer", minimum: 1 },
          reference: { type: "string", nullable: true, maxLength: 160 },
        },
      },
      StockMovement: {
        type: "object",
        required: ["id", "type", "quantity", "product", "warehouse", "createdAt"],
        properties: {
          id: { type: "string", format: "uuid" },
          type: { type: "string", enum: ["STOCK_IN", "STOCK_OUT", "RESERVE", "RELEASE", "TRANSFER", "ADJUSTMENT", "FULFILLMENT"] },
          quantity: { type: "integer", minimum: 1 },
          reference: { type: "string", nullable: true },
          product: {
            type: "object",
            required: ["id", "sku", "name"],
            properties: {
              id: { type: "string", format: "uuid" },
              sku: { type: "string" },
              name: { type: "string" },
            },
          },
          warehouse: {
            type: "object",
            required: ["id", "code", "name"],
            properties: {
              id: { type: "string", format: "uuid" },
              code: { type: "string" },
              name: { type: "string" },
            },
          },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      StockMovementListResponse: {
        type: "object",
        required: ["data", "pagination"],
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/StockMovement" } },
          pagination: { $ref: "#/components/schemas/PaginationMeta" },
        },
      },
      OrderItem: {
        type: "object",
        required: ["id", "product", "quantity", "unitPrice", "lineTotal"],
        properties: {
          id: { type: "string", format: "uuid" },
          product: {
            type: "object",
            required: ["id", "sku", "name", "unit"],
            properties: {
              id: { type: "string", format: "uuid" },
              sku: { type: "string" },
              name: { type: "string" },
              unit: { type: "string" },
            },
          },
          quantity: { type: "integer", minimum: 1 },
          unitPrice: { type: "number", minimum: 0 },
          lineTotal: { type: "number", minimum: 0 },
        },
      },
      Order: {
        type: "object",
        required: ["id", "orderNumber", "customerName", "status", "totalAmount", "items", "shipments", "createdAt", "updatedAt"],
        properties: {
          id: { type: "string", format: "uuid" },
          orderNumber: { type: "string" },
          customerName: { type: "string" },
          status: { type: "string", enum: ["DRAFT", "CONFIRMED", "RESERVED", "FULFILLED", "CANCELLED"] },
          totalAmount: { type: "number", minimum: 0 },
          items: { type: "array", items: { $ref: "#/components/schemas/OrderItem" } },
          shipments: { type: "array", items: { type: "object" } },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      OrderRequest: {
        type: "object",
        required: ["orderNumber", "customerName", "items"],
        properties: {
          orderNumber: { type: "string", minLength: 2, maxLength: 64 },
          customerName: { type: "string", minLength: 2, maxLength: 160 },
          items: {
            type: "array",
            minItems: 1,
            maxItems: 100,
            items: {
              type: "object",
              required: ["productId", "quantity"],
              properties: {
                productId: { type: "string", format: "uuid" },
                quantity: { type: "integer", minimum: 1 },
                unitPrice: { type: "number", minimum: 0 },
              },
            },
          },
        },
      },
      OrderStatusUpdateRequest: {
        type: "object",
        required: ["status"],
        properties: {
          status: { type: "string", enum: ["CONFIRMED", "RESERVED", "FULFILLED"] },
        },
      },
      OrderListResponse: {
        type: "object",
        required: ["data", "pagination"],
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/Order" } },
          pagination: { $ref: "#/components/schemas/PaginationMeta" },
        },
      },
      OrderResponse: {
        type: "object",
        required: ["data"],
        properties: {
          data: { $ref: "#/components/schemas/Order" },
        },
      },
      TrackingEvent: {
        type: "object",
        required: ["id", "status", "createdAt"],
        properties: {
          id: { type: "string", format: "uuid" },
          status: { type: "string" },
          location: { type: "string", nullable: true },
          note: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Shipment: {
        type: "object",
        required: ["id", "order", "status", "trackingEvents", "createdAt", "updatedAt"],
        properties: {
          id: { type: "string", format: "uuid" },
          order: {
            type: "object",
            required: ["id", "orderNumber", "customerName", "status", "totalAmount"],
            properties: {
              id: { type: "string", format: "uuid" },
              orderNumber: { type: "string" },
              customerName: { type: "string" },
              status: { type: "string", enum: ["DRAFT", "CONFIRMED", "RESERVED", "FULFILLED", "CANCELLED"] },
              totalAmount: { type: "number", minimum: 0 },
            },
          },
          carrier: { type: "string", nullable: true },
          trackingNumber: { type: "string", nullable: true },
          status: { type: "string", enum: ["PENDING", "ASSIGNED", "IN_TRANSIT", "DELIVERED", "CANCELLED"] },
          trackingEvents: { type: "array", items: { $ref: "#/components/schemas/TrackingEvent" } },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ShipmentRequest: {
        type: "object",
        required: ["orderId"],
        properties: {
          orderId: { type: "string", format: "uuid" },
          carrier: { type: "string", nullable: true, maxLength: 120 },
          trackingNumber: { type: "string", nullable: true, maxLength: 120 },
        },
      },
      ShipmentAssignRequest: {
        type: "object",
        required: ["carrier"],
        properties: {
          carrier: { type: "string", minLength: 2, maxLength: 120 },
          trackingNumber: { type: "string", nullable: true, maxLength: 120 },
        },
      },
      ShipmentStatusUpdateRequest: {
        type: "object",
        required: ["status"],
        properties: {
          status: { type: "string", enum: ["ASSIGNED", "IN_TRANSIT", "DELIVERED", "CANCELLED"] },
          location: { type: "string", nullable: true, maxLength: 160 },
          note: { type: "string", nullable: true, maxLength: 500 },
        },
      },
      TrackingEventRequest: {
        type: "object",
        required: ["status"],
        properties: {
          status: { type: "string", minLength: 2, maxLength: 80 },
          location: { type: "string", nullable: true, maxLength: 160 },
          note: { type: "string", nullable: true, maxLength: 500 },
        },
      },
      ShipmentListResponse: {
        type: "object",
        required: ["data", "pagination"],
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/Shipment" } },
          pagination: { $ref: "#/components/schemas/PaginationMeta" },
        },
      },
      ShipmentResponse: {
        type: "object",
        required: ["data"],
        properties: {
          data: { $ref: "#/components/schemas/Shipment" },
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
    "/api/v1/products": {
      get: {
        summary: "List products",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100 } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["ACTIVE", "ARCHIVED"] } },
          { name: "categoryId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "lowStock", in: "query", schema: { type: "boolean" } },
        ],
        responses: {
          "200": {
            description: "Tenant-scoped product list",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ProductListResponse" } } },
          },
          "401": { description: "Authentication required" },
          "403": { description: "products.read permission required" },
        },
      },
      post: {
        summary: "Create product",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ProductRequest" } } },
        },
        responses: {
          "201": {
            description: "Product created",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ProductResponse" } } },
          },
          "400": { description: "Validation error" },
          "401": { description: "Authentication required" },
          "403": { description: "products.write permission required" },
          "409": { description: "SKU already exists" },
        },
      },
    },
    "/api/v1/products/{id}": {
      get: {
        summary: "Get product",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": {
            description: "Product detail",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ProductResponse" } } },
          },
          "404": { description: "Product not found" },
        },
      },
      patch: {
        summary: "Update product",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ProductRequest" } } },
        },
        responses: {
          "200": {
            description: "Product updated",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ProductResponse" } } },
          },
          "404": { description: "Product not found" },
          "409": { description: "SKU already exists" },
        },
      },
      delete: {
        summary: "Archive product",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": {
            description: "Product archived",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ProductResponse" } } },
          },
          "404": { description: "Product not found" },
        },
      },
    },
    "/api/v1/categories": {
      get: {
        summary: "List categories",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Tenant-scoped category list",
            content: { "application/json": { schema: { $ref: "#/components/schemas/CategoryListResponse" } } },
          },
        },
      },
      post: {
        summary: "Create category",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CategoryRequest" } } },
        },
        responses: {
          "201": {
            description: "Category created",
            content: { "application/json": { schema: { $ref: "#/components/schemas/CategoryResponse" } } },
          },
          "409": { description: "Category already exists" },
        },
      },
    },
    "/api/v1/warehouses": {
      get: {
        summary: "List warehouses",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100 } },
          { name: "search", in: "query", schema: { type: "string", maxLength: 120 } },
        ],
        responses: {
          "200": {
            description: "Tenant-scoped warehouse list",
            content: { "application/json": { schema: { $ref: "#/components/schemas/WarehouseListResponse" } } },
          },
          "401": { description: "Authentication required" },
          "403": { description: "warehouses.read permission required" },
        },
      },
      post: {
        summary: "Create warehouse",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/WarehouseRequest" } } },
        },
        responses: {
          "201": {
            description: "Warehouse created",
            content: { "application/json": { schema: { $ref: "#/components/schemas/WarehouseResponse" } } },
          },
          "400": { description: "Validation error" },
          "401": { description: "Authentication required" },
          "403": { description: "warehouses.write permission required" },
          "409": { description: "Warehouse code already exists" },
        },
      },
    },
    "/api/v1/warehouses/{id}": {
      get: {
        summary: "Get warehouse",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": {
            description: "Warehouse detail",
            content: { "application/json": { schema: { $ref: "#/components/schemas/WarehouseResponse" } } },
          },
          "401": { description: "Authentication required" },
          "403": { description: "warehouses.read permission required" },
          "404": { description: "Warehouse not found" },
        },
      },
    },
    "/api/v1/warehouses/{id}/bins": {
      post: {
        summary: "Create warehouse bin",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/WarehouseBinRequest" } } },
        },
        responses: {
          "201": {
            description: "Warehouse bin created",
            content: { "application/json": { schema: { $ref: "#/components/schemas/WarehouseBinResponse" } } },
          },
          "400": { description: "Validation error" },
          "401": { description: "Authentication required" },
          "403": { description: "warehouses.write permission required" },
          "404": { description: "Warehouse not found" },
          "409": { description: "Warehouse bin code already exists" },
        },
      },
    },
    "/api/v1/inventory": {
      get: {
        summary: "List inventory",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100 } },
          { name: "productId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "warehouseId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "binId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "search", in: "query", schema: { type: "string", maxLength: 120 } },
          { name: "lowStock", in: "query", schema: { type: "boolean" } },
        ],
        responses: {
          "200": {
            description: "Tenant-scoped inventory list",
            content: { "application/json": { schema: { $ref: "#/components/schemas/InventoryListResponse" } } },
          },
          "401": { description: "Authentication required" },
          "403": { description: "inventory.read permission required" },
        },
      },
    },
    "/api/v1/inventory/stock-in": {
      post: {
        summary: "Add stock",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/StockMutationRequest" } } },
        },
        responses: {
          "201": {
            description: "Stock added",
            content: { "application/json": { schema: { $ref: "#/components/schemas/InventoryResponse" } } },
          },
          "400": { description: "Validation error" },
          "401": { description: "Authentication required" },
          "403": { description: "inventory.write permission required" },
          "404": { description: "Product or warehouse bin not found" },
        },
      },
    },
    "/api/v1/inventory/stock-out": {
      post: {
        summary: "Remove stock",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/StockMutationRequest" } } },
        },
        responses: {
          "201": {
            description: "Stock removed",
            content: { "application/json": { schema: { $ref: "#/components/schemas/InventoryResponse" } } },
          },
          "400": { description: "Validation error" },
          "401": { description: "Authentication required" },
          "403": { description: "inventory.write permission required" },
          "404": { description: "Product or warehouse bin not found" },
          "409": { description: "Insufficient stock" },
        },
      },
    },
    "/api/v1/orders": {
      get: {
        summary: "List orders",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100 } },
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["DRAFT", "CONFIRMED", "RESERVED", "FULFILLED", "CANCELLED"] },
          },
          { name: "search", in: "query", schema: { type: "string", maxLength: 120 } },
        ],
        responses: {
          "200": {
            description: "Tenant-scoped order list",
            content: { "application/json": { schema: { $ref: "#/components/schemas/OrderListResponse" } } },
          },
          "401": { description: "Authentication required" },
          "403": { description: "orders.read permission required" },
        },
      },
      post: {
        summary: "Create order and reserve inventory",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/OrderRequest" } } },
        },
        responses: {
          "201": {
            description: "Order created and inventory reserved",
            content: { "application/json": { schema: { $ref: "#/components/schemas/OrderResponse" } } },
          },
          "400": { description: "Validation error" },
          "401": { description: "Authentication required" },
          "403": { description: "orders.write permission required" },
          "404": { description: "Product not found" },
          "409": { description: "Insufficient stock or duplicate order number" },
        },
      },
    },
    "/api/v1/orders/{id}": {
      get: {
        summary: "Get order details",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": {
            description: "Tenant-scoped order details",
            content: { "application/json": { schema: { $ref: "#/components/schemas/OrderResponse" } } },
          },
          "401": { description: "Authentication required" },
          "403": { description: "orders.read permission required" },
          "404": { description: "Order not found" },
        },
      },
    },
    "/api/v1/orders/{id}/status": {
      patch: {
        summary: "Update order status",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/OrderStatusUpdateRequest" } } },
        },
        responses: {
          "200": {
            description: "Order status updated",
            content: { "application/json": { schema: { $ref: "#/components/schemas/OrderResponse" } } },
          },
          "400": { description: "Validation error" },
          "401": { description: "Authentication required" },
          "403": { description: "orders.write permission required" },
          "404": { description: "Order not found" },
          "409": { description: "Invalid transition or insufficient stock" },
        },
      },
    },
    "/api/v1/orders/{id}/cancel": {
      post: {
        summary: "Cancel order and release reserved inventory",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": {
            description: "Order cancelled",
            content: { "application/json": { schema: { $ref: "#/components/schemas/OrderResponse" } } },
          },
          "401": { description: "Authentication required" },
          "403": { description: "orders.write permission required" },
          "404": { description: "Order not found" },
          "409": { description: "Invalid transition or release target missing" },
        },
      },
    },
    "/api/v1/shipments": {
      get: {
        summary: "List shipments",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100 } },
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["PENDING", "ASSIGNED", "IN_TRANSIT", "DELIVERED", "CANCELLED"] },
          },
          { name: "orderId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "search", in: "query", schema: { type: "string", maxLength: 120 } },
        ],
        responses: {
          "200": {
            description: "Tenant-scoped shipment list",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ShipmentListResponse" } } },
          },
          "401": { description: "Authentication required" },
          "403": { description: "shipments.read permission required" },
        },
      },
      post: {
        summary: "Create shipment",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ShipmentRequest" } } },
        },
        responses: {
          "201": {
            description: "Shipment created",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ShipmentResponse" } } },
          },
          "400": { description: "Validation error" },
          "401": { description: "Authentication required" },
          "403": { description: "shipments.write permission required" },
          "404": { description: "Order not found" },
          "409": { description: "Order cannot be shipped" },
        },
      },
    },
    "/api/v1/shipments/{id}": {
      get: {
        summary: "Get shipment details",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": {
            description: "Tenant-scoped shipment details",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ShipmentResponse" } } },
          },
          "401": { description: "Authentication required" },
          "403": { description: "shipments.read permission required" },
          "404": { description: "Shipment not found" },
        },
      },
    },
    "/api/v1/shipments/{id}/assign": {
      patch: {
        summary: "Assign shipment",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ShipmentAssignRequest" } } },
        },
        responses: {
          "200": {
            description: "Shipment assigned",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ShipmentResponse" } } },
          },
          "400": { description: "Validation error" },
          "401": { description: "Authentication required" },
          "403": { description: "shipments.write permission required" },
          "404": { description: "Shipment not found" },
          "409": { description: "Shipment is closed" },
        },
      },
    },
    "/api/v1/shipments/{id}/status": {
      patch: {
        summary: "Update shipment status",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ShipmentStatusUpdateRequest" } } },
        },
        responses: {
          "200": {
            description: "Shipment status updated",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ShipmentResponse" } } },
          },
          "400": { description: "Validation error" },
          "401": { description: "Authentication required" },
          "403": { description: "shipments.write permission required" },
          "404": { description: "Shipment not found" },
          "409": { description: "Invalid shipment transition" },
        },
      },
    },
    "/api/v1/shipments/{id}/tracking-events": {
      post: {
        summary: "Append tracking event",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/TrackingEventRequest" } } },
        },
        responses: {
          "201": {
            description: "Tracking event appended",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ShipmentResponse" } } },
          },
          "400": { description: "Validation error" },
          "401": { description: "Authentication required" },
          "403": { description: "shipments.write permission required" },
          "404": { description: "Shipment not found" },
        },
      },
    },
    "/api/v1/stock-movements": {
      get: {
        summary: "List stock movements",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100 } },
          { name: "productId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "warehouseId", in: "query", schema: { type: "string", format: "uuid" } },
          {
            name: "type",
            in: "query",
            schema: {
              type: "string",
              enum: ["STOCK_IN", "STOCK_OUT", "RESERVE", "RELEASE", "TRANSFER", "ADJUSTMENT", "FULFILLMENT"],
            },
          },
        ],
        responses: {
          "200": {
            description: "Tenant-scoped stock movement history",
            content: { "application/json": { schema: { $ref: "#/components/schemas/StockMovementListResponse" } } },
          },
          "401": { description: "Authentication required" },
          "403": { description: "inventory.read permission required" },
        },
      },
    },
  },
};
