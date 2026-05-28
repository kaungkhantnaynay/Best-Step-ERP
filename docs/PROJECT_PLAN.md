# ERP SaaS Project Plan

## Product Goal

Best Step is a logistics ERP SaaS platform for inventory, warehouse operations, order management, shipment tracking, and operational analytics. The v1 product is multi-tenant from the start: every customer business belongs to an organization, and tenant-owned data is scoped by `organizationId`.

## Phase 1: Foundation and Monorepo Setup

- Convert the starter Next.js project into a monorepo with `frontend/`, `backend/`, and `docs/`.
- Keep frontend implementation in `frontend/` using Next.js, TypeScript, Tailwind, ShadCN UI, and Recharts.
- Keep backend implementation in `backend/` using Express, TypeScript, PostgreSQL, Prisma, JWT/RBAC, Redis, BullMQ, Docker, and Swagger.
- Maintain project documentation in `docs/`: scope, database schema, API routes, and system architecture.
- Configure shared repo scripts from the root workspace.

## Phase 2: Database and Tenancy Design

- Set up PostgreSQL and Prisma for the backend service.
- Model `organizations` as the root tenant entity.
- Add `organizationId` to all tenant-owned ERP records.
- Create authentication and authorization tables: users, roles, permissions, user roles, and refresh tokens.
- Create ERP domain tables for products, categories, warehouses, bins, inventory, stock movements, orders, order items, shipments, tracking history, notifications, and audit logs.
- Create the first Prisma migration only after the schema is reviewed against `docs/DATABASE_SCHEMA.md`.

## Phase 3: Backend Foundation

- Build an Express API with clear module boundaries:
  - `controllers`: HTTP request/response handling.
  - `services`: business logic and Prisma access.
  - `routes`: route registration and middleware composition.
  - `middlewares`: auth, RBAC, errors, logging, validation.
  - `validators`: request body/query/param schemas.
  - `jobs`: BullMQ queues, processors, and repeatable jobs.
- Add environment configuration, centralized error handling, request logging, CORS, security headers, and health checks.
- Add Swagger/OpenAPI generation and serve API docs from the backend.

## Phase 4: Authentication and RBAC

- Implement register, login, refresh token, logout, and current user endpoints.
- Hash passwords with a strong one-way password hashing library.
- Issue short-lived access tokens and longer-lived refresh tokens.
- Resolve `userId`, `organizationId`, roles, and permissions in auth middleware.
- Enforce RBAC on protected routes through backend middleware.
- Add seed data for default organization roles such as owner, admin, manager, and staff.

## Phase 5: Product Module

- Backend: create, update, delete, list, search, filter, paginate, and view products.
- Backend: support categories and SKU generation.
- Frontend: product table, create/edit form, search, filters, pagination, status badges, and detail view.
- Audit product changes and protect all product records by `organizationId`.

## Phase 6: Warehouse Module

- Backend: create warehouses, list warehouses, view warehouse details, manage bins, and support warehouse transfers.
- Frontend: warehouse dashboard, bin management UI, transfer stock form, and warehouse activity view.
- Validate that stock transfers create stock movement records and audit logs.

## Phase 7: Inventory Module

- Backend: add stock, remove stock, view stock movement history, calculate inventory valuation, and detect low stock.
- Frontend: inventory table, stock movement timeline, low stock cards, valuation summaries, and filters by warehouse/product/category.
- Queue low stock notification jobs through BullMQ.

## Phase 8: Order Module

- Backend: create orders, update order status, reserve inventory, cancel orders, and show order history.
- Frontend: order table, order details page, create order modal, and status workflows.
- Keep inventory reservation logic in backend services and wrap multi-record updates in database transactions.

## Phase 9: Shipment Module

- Backend: create shipments, assign shipments, update delivery status, track shipment history, and connect shipments to orders.
- Frontend: shipment dashboard, tracking timeline, shipment status cards, and assignment workflow.
- Queue shipment update notifications where needed.

## Phase 10: Analytics Dashboard

- Backend: expose dashboard metrics for total orders, revenue, inventory value, shipment performance, and warehouse activity.
- Frontend: build Recharts views for monthly sales, inventory trends, shipment performance, and warehouse activity.
- Keep analytics endpoints tenant-scoped and optimized for dashboard use.

## Phase 11: Advanced Features

- Audit logs: track entity changes and user actions.
- Notifications: low stock alerts, shipment updates, and order alerts.
- Background jobs: Redis + BullMQ for email jobs, notification jobs, and report generation.
- Real-time features: Socket.io for live notifications and dashboard updates.

## Phase 12: DevOps and API Documentation

- Dockerize frontend, backend, PostgreSQL, and Redis.
- Add `docker-compose.yml` for local development.
- Add GitHub Actions for lint, typecheck, tests, and build.
- Document all backend APIs with Swagger/OpenAPI.

## Phase 13: Deployment

- Deploy frontend to Vercel.
- Deploy backend to Render, Railway, or DigitalOcean.
- Deploy PostgreSQL with managed backups.
- Deploy Redis where background jobs and live updates require it.

## Phase 14: Portfolio Preparation

- Update `README.md` with screenshots, architecture diagram links, setup instructions, and feature list.
- Add GitHub repository link, live demo link, and deployment notes.
- Capture portfolio-ready screenshots after the dashboard, product, inventory, order, and shipment flows are usable.

## Bonus Features

- Barcode scanning.
- Invoice PDF generation.
- CSV/Excel export.
- Email notifications.
- Dark mode.
- AI inventory prediction.
- Mobile responsive optimization.
