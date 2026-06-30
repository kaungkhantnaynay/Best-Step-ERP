# Frontend Application State

## Summary

The frontend is now an API-wired Next.js App Router application with two experiences:

- Public/pre-auth pages for product positioning and authentication entry.
- Logged-in ERP screens for daily operations across products, inventory, warehouses, orders, shipments, analytics, notifications, audit logs, and settings.

Logged-in screens use authenticated API requests through `frontend/lib/api.ts` and `frontend/lib/use-authenticated-request.ts`. Frontend authorization remains a UX helper only; backend RBAC is the source of truth.

## Public Routes

- `/`: public product page with module previews and login/register calls to action.
- `/pricing`: pricing and plan comparison content.
- `/login`: login form wired to the backend auth API.
- `/register`: organization owner registration form wired to the backend auth API.

Public pages should feel bright, simple, centered, and product-led, inspired by NotebookLM's clarity without copying Google branding or content.

## App Routes

- `/app`: operational dashboard with KPI cards, Recharts analytics, low-stock watchlist, recent orders, warehouse activity, and shipment summaries.
- `/app/products`: product table, search, filters, pagination, create/update form, archive action, and detail navigation.
- `/app/products/[id]`: product detail view with stock and movement context.
- `/app/inventory`: inventory table, stock-in/stock-out workflows, low-stock filters, valuation, and movement history.
- `/app/warehouses`: warehouse list, bin management, transfer workflow, and warehouse activity.
- `/app/warehouses/[id]`: warehouse detail view.
- `/app/orders`: order list, status filters, create order workflow, and detail navigation.
- `/app/orders/[id]`: order detail view with items and shipment context.
- `/app/shipments`: shipment list, assignment/status workflows, and tracking summaries.
- `/app/shipments/[id]`: shipment detail view with tracking timeline.
- `/app/analytics`: dashboard analytics views backed by tenant-scoped API data.
- `/app/notifications`: notification list and read-state workflow.
- `/app/audit-logs`: tenant-scoped audit log viewer.
- `/app/settings`: workspace/account-oriented settings surface.

## Design Rules

- Use the bright, simple project theme: white/off-white surfaces, crisp dark text, soft neutral borders, and one dependable primary accent.
- Keep logged-in screens dense, scannable, and operational with tables, filters, forms, status badges, timelines, side navigation, and dashboards.
- Use Recharts for dashboard and analytics charts.
- Use ShadCN-compatible components and Tailwind utility classes where they fit the interface.
- Keep motion restrained and useful through clear hover/focus states and subtle transitions.
- Do not access Supabase directly from the frontend; all application data should flow through the Express API.

## Verification

- Run `npm run frontend:lint`.
- Run `npm run frontend:build`.
- Run the API and frontend locally, then verify:
  - Public routes render without authentication.
  - Authenticated app routes load tenant-scoped API data.
  - Tables, filters, forms, badges, charts, pagination controls, and timelines remain responsive.
  - The theme stays bright and work-focused, without dark hero panels or heavy gradients as the main visual direction.
  - Text does not overflow containers on desktop or mobile.
