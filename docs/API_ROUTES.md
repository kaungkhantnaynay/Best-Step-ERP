# API Routes Plan

Base path: `/api/v1`

## Health and Docs

- `GET /health`: service health check.
- `GET /docs`: Swagger UI.
- `GET /openapi.json`: OpenAPI JSON document.

## Auth

- `POST /auth/register`: create organization owner or invited user.
- `POST /auth/login`: authenticate user.
- `POST /auth/refresh`: rotate refresh token and issue a new access token.
- `POST /auth/logout`: revoke refresh token.
- `GET /auth/me`: return authenticated user, organization, roles, and permissions.

## Products and Categories

- `GET /products`: list products with search, filters, and pagination.
- `POST /products`: create product.
- `GET /products/:id`: get product details.
- `PATCH /products/:id`: update product.
- `DELETE /products/:id`: delete or archive product.
- `GET /categories`: list categories.
- `POST /categories`: create category.

## Warehouses and Inventory

- `GET /warehouses`: list warehouses.
- `POST /warehouses`: create warehouse.
- `GET /warehouses/:id`: get warehouse details.
- `POST /warehouses/:id/bins`: create warehouse bin.
- `GET /inventory`: list inventory by product, warehouse, bin, and low-stock state.
- `POST /inventory/stock-in`: add stock.
- `POST /inventory/stock-out`: remove stock.
- `POST /inventory/transfer`: transfer stock between warehouses or bins.
- `GET /stock-movements`: list movement history.

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
