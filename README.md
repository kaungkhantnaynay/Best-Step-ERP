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

Run the frontend:

```bash
npm run dev
```

Run frontend lint checks:

```bash
npm run lint
```

Backend scripts are scaffolded in `backend/package.json`; backend dependencies will be added when the Express API is implemented.
