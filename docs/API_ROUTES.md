# API Routes Plan

Base path: `/api/v1`

## Health and Docs

- `GET /health`: service health check.
- `GET /docs`: Swagger UI.
- `GET /openapi.json`: OpenAPI JSON document.

## Auth

- `POST /auth/register`: create organization owner.
- `POST /auth/login`: authenticate user.
- `POST /auth/refresh`: rotate refresh token and issue a new access token.
- `POST /auth/logout`: revoke refresh token.
- `POST /auth/logout-all`: revoke all refresh tokens for the authenticated user.
- `GET /auth/me`: return authenticated user, organization, roles, and permissions.

Auth rate limits:

- `POST /auth/register`: `AUTH_REGISTER_RATE_LIMIT_MAX_REQUESTS` per `AUTH_RATE_LIMIT_WINDOW_MS`.
- `POST /auth/login`: `AUTH_LOGIN_RATE_LIMIT_MAX_REQUESTS` per `AUTH_RATE_LIMIT_WINDOW_MS`.
- `POST /auth/refresh`: `AUTH_REFRESH_RATE_LIMIT_MAX_REQUESTS` per `AUTH_RATE_LIMIT_WINDOW_MS`.
- Auth rate limit errors return `429 RATE_LIMITED` with `details.retryAfter`.

## Products and Categories

- `GET /products`: list tenant-scoped products with search, status, category, low-stock filters, and page pagination.
- `POST /products`: create tenant-scoped product; SKU may be provided or generated.
- `GET /products/:id`: get tenant-scoped product details with category, stock, value, and location summary.
- `PATCH /products/:id`: update tenant-scoped product.
- `DELETE /products/:id`: archive tenant-scoped product by setting `status=ARCHIVED`.
- `GET /categories`: list tenant-scoped categories.
- `POST /categories`: create tenant-scoped category.

## Warehouses and Inventory

- `GET /warehouses`: list tenant-scoped warehouses with search and page pagination.
- `POST /warehouses`: create warehouse.
- `GET /warehouses/:id`: get warehouse details.
- `POST /warehouses/:id/bins`: create warehouse bin.
- `GET /inventory`: list tenant-scoped inventory by product, warehouse, bin, search, and low-stock state with page pagination.
- `POST /inventory/stock-in`: add stock and record a stock movement.
- `POST /inventory/stock-out`: remove stock, reject insufficient stock, record a stock movement, and create low-stock notifications when thresholds are crossed.
- `POST /inventory/transfer`: transfer stock between warehouses or bins.
- `GET /stock-movements`: list tenant-scoped movement history by product, warehouse, and movement type with page pagination.

## Orders

- `GET /orders`: list orders.
- `POST /orders`: create order and reserve inventory.
- `GET /orders/:id`: get order details.
- `PATCH /orders/:id/status`: update order status.
- `POST /orders/:id/cancel`: cancel order and release reserved inventory.

## Shipments

- `GET /shipments`: list shipments.
- `POST /shipments`: create shipment for an order.
- `GET /shipments/:id`: get shipment details.
- `PATCH /shipments/:id/assign`: assign carrier or handler.
- `PATCH /shipments/:id/status`: update shipment status.
- `POST /shipments/:id/tracking-events`: append tracking history.

## Analytics, Notifications, and Audit

- `GET /analytics/summary`: totals for orders, revenue, inventory value, shipment performance, and warehouse activity.
- `GET /analytics/sales`: monthly sales chart data.
- `GET /analytics/inventory-trends`: inventory trend chart data.
- `GET /analytics/shipment-performance`: shipment performance chart data.
- `GET /notifications`: list notifications.
- `PATCH /notifications/:id/read`: mark notification as read.
- `GET /audit-logs`: list audit events.

## API Rules

- All tenant-owned endpoints require authentication.
- All tenant-owned queries must be scoped by `organizationId`.
- RBAC permissions must be enforced in backend middleware.
- Request validation must run before controller logic.
- Swagger docs must be updated whenever routes or request/response shapes change.
