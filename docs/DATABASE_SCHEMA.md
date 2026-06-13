# Database Schema Plan

## Tenancy Rule

`organizations` is the root tenant table. Every tenant-owned business table must include `organizationId`, and backend services must scope queries by the authenticated request organization.

## Core Tables

### SaaS and Auth

- `organizations`: customer workspace/business tenant.
- `users`: account identity and profile.
- `roles`: organization-level role records.
- `permissions`: permission catalog.
- `user_roles`: user-to-role assignment.
- `role_permissions`: role-to-permission assignment.
- `refresh_tokens`: refresh token storage and revocation.

### Inventory and Catalog

- `categories`: tenant-scoped product categories.
- `products`: SKU, name, description, category, status, unit, pricing, and reorder threshold.
- `inventory`: product quantity by warehouse/bin.
- `stock_movements`: add, remove, reserve, release, transfer, adjustment, and fulfillment history.
  - Warehouse transfers use two `TRANSFER` movement rows with the same reference: a negative quantity at the source warehouse and a positive quantity at the destination warehouse.

### Warehouse Operations

- `warehouses`: tenant-owned warehouse locations.
- `warehouse_bins`: physical or logical bin locations inside warehouses.

### Orders and Shipments

- `orders`: customer/order header, status, totals, and audit metadata.
- `order_items`: products, quantities, pricing, and reservation state.
- `shipments`: carrier, tracking number, assignment, status, dates, and related order.
- `tracking_history`: shipment event timeline.

### System

- `notifications`: in-app notification records.
- `audit_logs`: user action and entity change history.

## Prisma Defaults

- Use UUID primary keys.
- Use `createdAt` and `updatedAt` timestamps on mutable tables.
- Use soft delete only when the business flow requires recovery or audit visibility.
- Use explicit database transactions for inventory reservation, stock movement, order status changes, and warehouse transfers.
- Add indexes for `organizationId`, common filters, foreign keys, SKU, order status, shipment status, and created date.
