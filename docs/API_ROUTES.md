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

Authenticated API rate limits:

- Tenant-owned authenticated routes are limited by `AUTHENTICATED_RATE_LIMIT_MAX_REQUESTS` per `AUTHENTICATED_RATE_LIMIT_WINDOW_MS`, keyed by organization and user.
- Sensitive authenticated mutations are additionally limited by `SENSITIVE_MUTATION_RATE_LIMIT_MAX_REQUESTS` per `SENSITIVE_MUTATION_RATE_LIMIT_WINDOW_MS`.
- Dashboard report generation is additionally limited by `REPORT_RATE_LIMIT_MAX_REQUESTS` per `REPORT_RATE_LIMIT_WINDOW_MS`.
- Rate limit errors return `429 RATE_LIMITED` with `details.retryAfter` and `RateLimit-*` headers.

## Users

- `POST /users/admin`: create an admin user in the authenticated organization. Requires `users.admin.create`.

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
- `POST /warehouse-transfers`: transfer product stock between tenant-owned bins in a transaction and record paired transfer movements. Requires `inventory.write`.
- `GET /inventory`: list tenant-scoped inventory by product, warehouse, bin, search, and low-stock state with page pagination.
- `POST /inventory/stock-in`: add stock and record a stock movement.
- `POST /inventory/stock-out`: remove stock, reject insufficient stock, record a stock movement, and create low-stock notifications when thresholds are crossed.
- `GET /stock-movements`: list tenant-scoped movement history by product, warehouse, and movement type with page pagination.

## Orders

- `GET /orders`: list tenant-scoped orders with `page`, `limit`, `status`, and `search` filters. Requires `orders.read`.
- `POST /orders`: create an order, reserve inventory in a transaction, and record reservation movements. Requires `orders.write`.
- `GET /orders/:id`: get tenant-scoped order details with items and shipments. Requires `orders.read`.
- `PATCH /orders/:id/status`: update order status through allowed workflow transitions. Requires `orders.write`.
- `POST /orders/:id/cancel`: cancel an order and release reserved inventory in a transaction. Requires `orders.write`.

## Shipments

- `GET /shipments`: list tenant-scoped shipments with `page`, `limit`, `status`, `orderId`, and `search` filters. Requires `shipments.read`.
- `POST /shipments`: create a shipment for a tenant order and append the initial tracking event. Requires `shipments.write`.
- `GET /shipments/:id`: get tenant-scoped shipment details with order summary and tracking timeline. Requires `shipments.read`.
- `PATCH /shipments/:id/assign`: assign carrier and tracking number. Requires `shipments.write`.
- `PATCH /shipments/:id/status`: update shipment status through allowed workflow transitions and append history. Requires `shipments.write`.
- `POST /shipments/:id/tracking-events`: append tracking history and queue a shipment notification. Requires `shipments.write`.

## Analytics, Notifications, and Audit

- `GET /analytics/dashboard`: tenant-scoped KPI summary, order status counts, shipment status counts, and movement summaries. Requires `analytics.read`.
- `POST /analytics/reports/dashboard`: queue tenant-scoped dashboard summary report generation through BullMQ. Requires `analytics.read`.
- `GET /notifications`: list tenant-scoped notifications with page pagination and optional `unread=true`. Requires `notifications.read`.
- `PATCH /notifications/:id/read`: mark a tenant notification as read. Requires `notifications.write`.
- `GET /audit-logs`: list tenant-scoped audit events with `page`, `limit`, `entityType`, `entityId`, and `action` filters. Requires `audit.read`.

## API Rules

- All tenant-owned endpoints require authentication.
- All tenant-owned queries must be scoped by `organizationId`.
- RBAC permissions must be enforced in backend middleware.
- Request validation must run before controller logic.
- Swagger docs must be updated whenever routes or request/response shapes change.
