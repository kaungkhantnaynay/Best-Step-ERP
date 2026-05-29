# Frontend UI Plan: Public Site + ERP App

## Summary

Build the frontend as two distinct experiences. Pre-auth visitors get a lightweight SaaS marketing site. Logged-in users get a dense, task-focused ERP application. Public pages should feel bright, simple, centered, and product-led, inspired by NotebookLM's clarity without copying Google branding or content.

## Key Changes

- Public/pre-auth routes:
  - `/`: landing page with hero, feature highlights, module preview, social proof placeholders, pricing CTA, and login/register CTAs.
  - `/pricing`: simple pricing cards and plan comparison.
  - `/login` and `/register`: auth entry screens styled for the brand, ready for future backend wiring.
- App/post-auth routes:
  - `/app`: ERP dashboard with KPI tiles, Recharts analytics, low-stock cards, recent orders, warehouse activity, and shipment timeline.
  - `/app/products`: product table, search, filters, status badges, pagination, and product form modal/drawer.
  - `/app/inventory`: inventory table, stock movement timeline, low-stock warning cards, and stock adjustment UI.
  - `/app/warehouses`: warehouse dashboard, bin management UI, and transfer stock form.
  - `/app/orders`: order table, status filters, order detail panel, and create order modal.
  - `/app/shipments`: shipment dashboard, status cards, and tracking timeline.
  - `/app/analytics` and `/app/notifications`: static first-pass screens aligned to `TASKS.md`.
- Shared frontend foundation:
  - Add `recharts`, `lucide-react`, and ShadCN-compatible component utilities.
  - Define project theme tokens in `frontend/app/globals.css`.
  - Use mock data and frontend-local TypeScript types for ERP entities.
  - Keep mock data separate from UI components so API wiring can replace it later.

## Product Rules

- Public pages may use lightweight marketing language, CTAs, feature highlights, pricing, and social proof.
- Public pages should use white/off-white surfaces, crisp text, soft borders, simple product previews, and direct centered messaging.
- Logged-in app pages must stay dense, operational, clean, and task-focused.
- Interactions should stay restrained and useful: subtle reveal timing, clear hover/focus states, and no decorative animation.
- Marketing inside the app is only allowed for contextual cases: empty states, upgrade prompts for locked features, onboarding checklist, or setup guidance.
- Frontend auth checks are UX helpers only; backend RBAC remains the source of truth once APIs exist.
- Do not access Supabase directly from the frontend in this phase.

## Test Plan

- Run `npm run lint --workspace frontend`.
- Run `npm run build --workspace frontend`.
- Start the frontend dev server and verify:
  - `/` is a polished public landing page.
  - `/app` is the real ERP dashboard, not marketing content.
  - Main module routes render correctly.
  - Charts, tables, filters, forms, badges, pagination controls, and timelines are responsive.
  - Vintage palettes, heavy gradients, and dark hero panels are not used as the main theme.
  - Text does not overflow containers on desktop or mobile.

## Assumptions

- This phase is a static prototype using realistic mock data.
- Backend API wiring, real auth, RBAC, and persistence come later.
- The first implementation should prioritize visual structure, navigation, and workflow clarity over live data.
