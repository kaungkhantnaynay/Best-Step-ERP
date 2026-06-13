# Best Step ERP SaaS

Best Step is a full-stack logistics ERP SaaS project focused on inventory management, warehouse operations, order management, shipment tracking, and analytics.

## Stack

- Frontend: Next.js, TypeScript, Tailwind CSS, ShadCN UI, Recharts
- Backend: Node.js, Express, TypeScript, PostgreSQL, Prisma
- Auth: JWT, refresh tokens, RBAC
- Infrastructure: Redis, BullMQ, Docker, Swagger/OpenAPI

## Repository Structure

```text
.
├── frontend/   # Next.js app
├── backend/    # Express API and worker code
├── docs/       # Project plan, architecture, schema, and API docs
├── TASKS.md    # Original task checklist
└── AGENTS.md   # Rules for future coding agents
```

## Documentation

- [Project plan](docs/PROJECT_PLAN.md)
- [System architecture](docs/SYSTEM_ARCHITECTURE.md)
- [Database schema plan](docs/DATABASE_SCHEMA.md)
- [API routes plan](docs/API_ROUTES.md)
- [Project scope](docs/PROJECT_SCOPE.md)

## Development

Install dependencies from the repository root:

```bash
npm install
```

Copy backend environment placeholders and fill in Supabase PostgreSQL credentials:

```bash
cp backend/.env.example backend/.env
```

Start a local Redis server separately, or point `REDIS_URL` at an available Redis instance for BullMQ-backed jobs.

Run the frontend and backend together:

```bash
npm run dev:all
```

Or run each process separately:

```bash
npm run frontend:dev
npm run backend:dev
npm run backend:worker:auth
```

## Verification

Run the full local check suite from the repository root:

```bash
npm run check
```

Useful targeted checks:

```bash
npm run frontend:lint
npm run frontend:build
npm run backend:build
npm run backend:lint
npm run backend:test
```

## Current MVP Status

- Auth, refresh tokens, RBAC, products, warehouses, inventory, orders, shipments, analytics, and notifications have backend routes.
- Logged-in ERP screens are wired to authenticated API calls instead of static mock data.
- Supabase PostgreSQL remains the database infrastructure; Prisma migrations and the Express API remain the application source of truth.
- Redis is used for background-job infrastructure via `REDIS_URL`; Supabase PostgreSQL remains the active database target.
