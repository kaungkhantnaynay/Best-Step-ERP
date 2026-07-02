# Production Readiness

## Summary

This project is ready for deployment preparation, but this document is a checklist and operating guide rather than proof that production deployment has already happened. Keep secrets in platform environment variables only; never commit real credentials.

Recommended production shape:

- Frontend: Vercel or another Next.js-capable host.
- Backend API: Render, Railway, DigitalOcean, or another Node.js process host.
- Worker: a separate long-running Node.js process using the same backend build.
- Database: Supabase-hosted PostgreSQL.
- Queue/cache: managed Redis compatible with BullMQ.

## Frontend

Build command:

```bash
npm run frontend:build
```

Required environment variable:

```text
NEXT_PUBLIC_API_BASE_URL=https://<backend-host>/api/v1
```

Notes:

- Set `NEXT_PUBLIC_API_BASE_URL` to the public HTTPS URL for the deployed backend API.
- The frontend should not connect directly to Supabase for application data.
- After deployment, verify public pages and authenticated app routes against the deployed backend.

## Backend API

Build command:

```bash
npm run backend:build
```

Start command:

```bash
npm run start --workspace backend
```

Required production environment variables:

```text
NODE_ENV=production
PORT=<platform-port>
DATABASE_URL=<supabase-runtime-postgres-url>
JWT_ACCESS_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<strong-random-secret>
REDIS_URL=<managed-redis-url>
CORS_ORIGIN=https://<frontend-host>
```

Recommended environment variables:

```text
DIRECT_DATABASE_URL=<supabase-direct-postgres-url>
POOLED_DATABASE_URL=<supabase-pooled-postgres-url>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
REFRESH_TOKEN_COOKIE_NAME=best_step_refresh
AUTH_RATE_LIMIT_WINDOW_MS=60000
AUTH_LOGIN_RATE_LIMIT_MAX_REQUESTS=10
AUTH_REGISTER_RATE_LIMIT_MAX_REQUESTS=5
AUTH_REFRESH_RATE_LIMIT_MAX_REQUESTS=30
AUTHENTICATED_RATE_LIMIT_WINDOW_MS=60000
AUTHENTICATED_RATE_LIMIT_MAX_REQUESTS=120
SENSITIVE_MUTATION_RATE_LIMIT_WINDOW_MS=60000
SENSITIVE_MUTATION_RATE_LIMIT_MAX_REQUESTS=20
REPORT_RATE_LIMIT_WINDOW_MS=60000
REPORT_RATE_LIMIT_MAX_REQUESTS=5
AUTH_REFRESH_TOKEN_CLEANUP_CRON=0 3 * * *
AUTH_REFRESH_TOKEN_CLEANUP_RETENTION_DAYS=30
LOG_LEVEL=info
```

Notes:

- `CORS_ORIGIN` must match the deployed frontend origin exactly.
- JWT secrets must be different from each other and generated with high entropy.
- The backend API process must be able to reach Supabase PostgreSQL and Redis.

## Workers

Worker start command:

```bash
npm run backend:worker:all
```

The worker process must use the same backend environment values as the API process, especially:

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `AUTH_REFRESH_TOKEN_CLEANUP_CRON`
- `AUTH_REFRESH_TOKEN_CLEANUP_RETENTION_DAYS`

Worker responsibilities:

- Refresh-token cleanup.
- In-app notification creation.
- Email queue processing.
- Dashboard report generation.

Run the worker as a separate process from the API so background jobs keep running even when no HTTP request is active.

## Supabase PostgreSQL

- Use Prisma schema and Prisma migrations as the application database source of truth.
- Use a direct Supabase database URL for migrations and administrative operations.
- Use a pooled Supabase database URL for runtime when the deployment target is serverless or horizontally scaled.
- Run migrations before sending production traffic to the backend.
- Review Supabase security and performance advisors before launch and after major schema changes.
- Do not expose application tables directly through frontend Supabase clients unless row-level security policies and grants are intentionally designed and documented.

Migration command:

```bash
npm run prisma:migrate --workspace backend
```

Production migration execution should be done from a secure environment with the direct database URL available.

## Redis

- Use a managed Redis instance compatible with BullMQ.
- The backend API and worker processes must point to the same `REDIS_URL`.
- Redis is required for distributed rate limiting, notification jobs, email jobs, report jobs, and auth maintenance jobs.
- Monitor failed jobs and Redis connectivity in the hosting platform logs.

## Verification Checklist

Before marking production deployment complete:

- `npm run check` passes locally or in CI.
- Frontend host has `NEXT_PUBLIC_API_BASE_URL` set to the backend `/api/v1` base URL.
- Backend API host has all required production environment variables.
- Worker host runs `npm run backend:worker:all` with the same database and Redis environment.
- Prisma migrations have been applied to the production Supabase database.
- Supabase security and performance advisors have been reviewed.
- `GET /api/v1/health` succeeds on the deployed backend.
- `GET /api/v1/openapi.json` succeeds on the deployed backend.
- Register, login, refresh, and logout work from the deployed frontend.
- Core app routes load tenant-scoped data.
- Background jobs can create notifications and process report jobs.
