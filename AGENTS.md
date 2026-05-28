# Agent Rules for Best Step ERP SaaS

## Project Shape

- This repository is a monorepo.
- Frontend code lives in `frontend/`.
- Backend code lives in `backend/`.
- Planning and architecture docs live in `docs/`.
- Do not add application source files at the repository root unless they are workspace-level config files.
- Keep the root `package.json` focused on workspace orchestration.

## Tech Stack

- Frontend: Next.js, TypeScript, Tailwind CSS, ShadCN UI, and Recharts.
- Backend: Node.js, Express, TypeScript, PostgreSQL hosted on Supabase, and Prisma.
- Auth: JWT access tokens, refresh tokens, and RBAC.
- Jobs and infrastructure: Redis, BullMQ, Docker, and Swagger/OpenAPI.

## Frontend Rules

- Use the Next.js App Router.
- Build ERP application screens directly; do not create a marketing landing page as the primary experience.
- Use ShadCN UI components where they fit the interface.
- Use Tailwind utility classes for styling and keep layouts dense, scannable, and work-focused.
- Use Recharts for dashboard and analytics charts.
- Prefer tables, filters, segmented controls, forms, status badges, timelines, side navigation, and dashboards.
- Keep frontend authorization checks as UX helpers only. Backend RBAC is the source of truth.
- Keep API client code organized and typed. Do not duplicate backend business rules in the frontend.

## Frontend Design Theme Rules

- Build the product UI around warm parchment creams (`#F5EFE0`), rust terracotta (`#B85C38`), olive green, dusty umber browns, and muted sky blue.
- Do not use cold grays or modern blues in the interface palette.
- Use the theme through Tailwind tokens, CSS variables, or ShadCN theme configuration rather than scattering one-off color values through components.
- Keep ERP screens dense, scannable, and operational while using the warm palette for surfaces, borders, status accents, charts, and navigation states.
- Preserve accessible contrast for text, controls, badges, charts, focus rings, and disabled states within the approved palette.

## Backend Rules

- Keep backend code inside `backend/src`.
- Use this structure:
  - `controllers`: HTTP request and response handling.
  - `routes`: route definitions and middleware composition.
  - `services`: business logic and Prisma access.
  - `middlewares`: auth, RBAC, validation, logging, and error handling.
  - `validators`: request validation schemas.
  - `utils`: shared backend helpers.
  - `prisma`: Prisma client setup and database helpers.
  - `types`: shared backend TypeScript types.
  - `jobs`: BullMQ queues and processors.
- Controllers should stay thin. Put business rules in services.
- Use centralized error handling instead of ad hoc response handling.
- Validate request params, query strings, and bodies before controller logic.
- Use database transactions for stock reservations, stock transfers, order cancellation, fulfillment, and any multi-record inventory update.

## Rate Limiting and API Throttling Rules

- Apply rate limits to public auth endpoints, password reset flows, token refresh, webhooks, and other abuse-prone routes.
- Use tenant-aware and user-aware throttling for authenticated API routes where practical.
- Use IP-based throttling only as a fallback or additional signal because users may share networks.
- Store distributed rate limit counters in Redis for multi-instance backend deployments.
- Return `429 Too Many Requests` with a consistent error shape and a retry hint when a limit is exceeded.
- Keep rate limit thresholds configurable through environment variables, not hardcoded in route files.
- Add stricter limits for login, refresh token rotation, invite acceptance, export generation, and bulk mutation endpoints.
- Document route-specific limits in Swagger/OpenAPI when the limit affects client behavior.

## Logging Rules

- Use centralized structured logging middleware for HTTP requests, responses, errors, and job processing events.
- Include request IDs, user IDs, organization IDs, route names, status codes, latency, and job IDs where available.
- Never log passwords, JWTs, refresh tokens, API keys, session cookies, payment data, or other secrets.
- Log authorization failures, validation failures, rate limit events, token reuse detection, and suspicious auth activity at appropriate levels.
- Use `debug` for local diagnostic detail, `info` for normal lifecycle events, `warn` for recoverable risk, and `error` for failed operations requiring attention.
- Avoid ad hoc `console.log` calls in application code; route logs through the shared logger.
- Make logs tenant-scoped where possible without exposing cross-tenant data.
- Keep error responses user-safe while preserving detailed stack traces in server logs for non-production or secure log sinks.

## Pagination and Filtering Rules

- Use pagination for list endpoints that can grow beyond a small bounded set.
- Prefer cursor-based pagination for high-volume or frequently changing data such as orders, inventory movements, audit logs, notifications, and activity feeds.
- Offset pagination is acceptable for small admin lists where stable ordering is not critical.
- Always apply deterministic ordering for paginated queries, usually by `createdAt` plus `id` as a tie breaker.
- Validate and cap `limit`, `page`, `cursor`, sort, and filter parameters before they reach service logic.
- Return pagination metadata consistently, including `limit`, `nextCursor` or page counts depending on pagination style.
- Keep filters tenant-scoped and indexed when they are common query paths.
- Do not expose unbounded exports or list endpoints without explicit limits, background jobs, or streaming safeguards.

## Database and Prisma Rules

- Use Prisma for database access.
- Use Supabase as the managed PostgreSQL hosting platform for shared development, staging, and production databases.
- Do not hand-write SQL for normal CRUD when Prisma can express the query clearly.
- Use UUID primary keys unless there is a documented reason not to.
- Add `createdAt` and `updatedAt` fields to mutable tables.
- Create migrations through Prisma and commit migration files with schema changes.
- Do not edit applied migration files. Create a new migration instead.
- Add indexes for tenant scoping, foreign keys, common filters, SKU, statuses, and dates.

## Supabase Database Rules

- Treat Supabase as PostgreSQL infrastructure for this project, not as a replacement for the Express API, Prisma service layer, custom JWT auth, refresh token lifecycle, or backend RBAC unless the project explicitly changes direction.
- Keep Prisma schema and Prisma migrations as the application database source of truth.
- Store Supabase connection strings and project references only in environment variables or `.env.example` placeholders; never commit real Supabase credentials, service role keys, database passwords, or JWT secrets.
- Use Supabase pooled connection URLs where appropriate for deployed serverless or horizontally scaled backend environments, and direct database URLs for migrations when required.
- Enable and review Supabase security and performance advisors before production database launch and after major schema changes.
- Do not expose application tables directly through Supabase client-side Data API access unless row-level security policies and grants have been intentionally designed and documented.
- If Supabase Realtime, Storage, Edge Functions, or Auth are introduced later, document the architecture decision before wiring them into application code.

## Tenancy Rules

- `organizations` is the root tenant entity.
- All tenant-owned records must include `organizationId`.
- Auth middleware must resolve `userId`, `organizationId`, roles, and permissions for protected requests.
- Every service query for tenant-owned data must scope by `organizationId`.
- Never trust `organizationId` from the request body when it can be derived from the authenticated token/session context.
- Audit logs and notifications must also be tenant-scoped.

## Auth and RBAC Rules

- Use short-lived JWT access tokens and refresh tokens.
- Store password hashes only; never store plaintext passwords.
- Enforce RBAC in backend middleware.
- Use permission checks for protected operations, not only role-name checks.
- Admin-only routes must be explicitly protected.
- Frontend route guards must not replace backend authorization.
- Do not mix Supabase Auth with custom JWT/RBAC flows unless an explicit migration plan is documented.

## Refresh Token Lifecycle Rules

- Store refresh tokens server-side as hashes, never as plaintext token values.
- Rotate refresh tokens on every successful refresh and invalidate the previous token in the same transaction.
- Track refresh token family, user, organization, device/session metadata, creation time, expiry time, and revocation time.
- Detect refresh token reuse and revoke the entire token family when reuse is suspected.
- Support logout for the current session and logout-all-devices by revoking the relevant refresh tokens.
- Keep refresh token expiry longer than access token expiry, but finite and configurable.
- Require re-authentication for sensitive account, billing, role, and permission changes when appropriate.
- Clean up expired and revoked refresh tokens through a scheduled job.
- Rate-limit refresh attempts and log failed refresh, reuse detection, and revocation events.

## Jobs and Realtime Rules

- Use Redis with BullMQ for background work.
- Use jobs for email, low-stock alerts, shipment updates, report generation, and other slow or retryable work.
- Keep job producers close to the service action that emits the business event.
- Keep job processors idempotent where practical.
- Socket.io or realtime updates should publish tenant-scoped events only.

## Swagger and Documentation Rules

- Swagger/OpenAPI docs must be updated when backend routes, request bodies, response shapes, or auth requirements change.
- Keep architecture decisions reflected in `docs/SYSTEM_ARCHITECTURE.md`.
- Keep planned database shape reflected in `docs/DATABASE_SCHEMA.md`.
- Keep route inventory reflected in `docs/API_ROUTES.md`.
- Mermaid is the official diagram format for this project.

## Environment and Docker Rules

- Do not commit real secrets.
- Use `.env.example` files to document required variables.
- Expected backend variables include Supabase PostgreSQL database URL, optional direct and pooled database URLs, JWT secrets, refresh token secret, Redis URL, CORS origin, and port.
- Docker Compose should eventually run frontend, backend, Redis, and worker processes for local development; a local PostgreSQL container is optional when Supabase is the active database target.

## Testing and Verification

- Run frontend checks from the root with `npm run lint` or directly with `npm run lint --workspace frontend`.
- Backend checks should use:
  - `npm run build --workspace backend`
  - `npm run lint --workspace backend`
  - `npm run test --workspace backend`
- Add or update tests when changing backend services, auth/RBAC behavior, rate limiting, refresh token lifecycle, pagination, inventory transactions, or shared API contracts.
- Unit tests should cover service-layer business rules, validators, middleware behavior, permission checks, pagination helpers, and error handling.
- Keep controllers thin enough that most behavior can be tested through services and middleware without brittle HTTP setup.
- Mock external systems such as Redis, email providers, queues, and third-party APIs in unit tests unless an integration test is explicitly intended.
- Add transaction-focused tests for stock reservations, transfers, fulfillment, cancellation, token rotation, and multi-record mutations.
- Test tenant isolation for service queries and authorization middleware whenever tenant-owned data is touched.
- Include negative tests for validation failures, permission denials, expired tokens, revoked tokens, rate limit violations, and malformed pagination input.
- Prefer deterministic fixtures and factories over shared mutable test data.
- After moving files or changing workspace config, verify scripts from the repository root.

## Change Safety

- Keep changes scoped to the requested task.
- Do not delete user-created work unless explicitly asked.
- Preserve existing docs unless replacing them is part of the request.
- Prefer clear, boring code and explicit module boundaries over clever abstractions.
