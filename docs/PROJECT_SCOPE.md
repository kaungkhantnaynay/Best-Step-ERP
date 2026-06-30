# Project Scope

## In Scope for V1

- Multi-tenant logistics ERP SaaS using organization-based tenancy.
- JWT authentication with refresh tokens.
- Role-based access control.
- Product and category management.
- Warehouse and bin management.
- Inventory quantities, stock movement history, low-stock alerts, and valuation.
- Order creation, reservation, status updates, cancellation, and history.
- Shipment creation, assignment, status tracking, and timeline history.
- Analytics dashboard with Recharts.
- Notifications and audit logs.
- Redis and BullMQ background jobs.
- Local development through npm scripts, Supabase PostgreSQL connection strings, and a separately managed Redis instance.
- Swagger/OpenAPI documentation.

## Out of Scope for Initial V1

- Native mobile apps.
- Complex accounting ledger.
- Advanced procurement workflows.
- Marketplace integrations.
- AI inventory prediction.
- Invoice PDF generation.
- Barcode scanning.

## Product Experience

The frontend should feel like an operational ERP dashboard, not a marketing site. Prioritize clear navigation, dense tables, filters, forms, timelines, status indicators, and charts that support repeated daily work.

## Success Criteria

- A developer can run frontend and backend locally from the monorepo.
- Authenticated users can access only their organization data.
- Core ERP modules have documented API contracts and database models before implementation.
- The app has enough documentation for another agent or engineer to continue safely.
