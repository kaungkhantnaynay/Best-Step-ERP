# System Architecture

## High-Level Architecture

```mermaid
flowchart LR
  User[ERP User] --> Browser[Browser]
  Browser --> Frontend[Next.js Frontend<br/>TypeScript + Tailwind + ShadCN UI + Recharts]
  Frontend --> API[Express API<br/>TypeScript + Swagger]
  API --> Auth[JWT Auth + RBAC Middleware]
  Auth --> Services[Domain Services]
  Services --> Prisma[Prisma ORM]
  Prisma --> Postgres[(PostgreSQL)]
  Services --> Queue[BullMQ Queues]
  Queue --> Redis[(Redis)]
  Queue --> Workers[Background Workers]
  Workers --> Postgres
  Workers --> Notifications[Email / In-App Notifications]
```

## Request and Auth Flow

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant FE as Next.js Frontend
  participant API as Express API
  participant Auth as Auth Middleware
  participant RBAC as RBAC Middleware
  participant Service as Domain Service
  participant DB as PostgreSQL

  User->>FE: Performs ERP action
  FE->>API: Sends request with access token
  API->>Auth: Validate JWT
  Auth->>Auth: Resolve userId, organizationId, roles, permissions
  Auth->>RBAC: Check required permission
  RBAC->>Service: Continue authorized request
  Service->>DB: Query tenant-scoped data by organizationId
  DB-->>Service: Return data
  Service-->>API: Return result
  API-->>FE: JSON response
  FE-->>User: Updated UI
```

## Background Job Flow

```mermaid
flowchart TD
  API[Express API] --> Event[Business Event<br/>low stock, shipment update, report request]
  Event --> Queue[BullMQ Queue]
  Queue --> Redis[(Redis)]
  Redis --> Worker[Worker Processor]
  Worker --> JobLogic[Notification / Email / Report Logic]
  JobLogic --> DB[(PostgreSQL)]
  JobLogic --> Delivery[Email or In-App Notification]
  Worker --> Audit[Audit Log Entry]
```

## Core ERP Data Relationships

```mermaid
erDiagram
  ORGANIZATIONS ||--o{ USERS : has
  ORGANIZATIONS ||--o{ PRODUCTS : owns
  ORGANIZATIONS ||--o{ WAREHOUSES : owns
  ORGANIZATIONS ||--o{ ORDERS : owns
  ORGANIZATIONS ||--o{ SHIPMENTS : owns
  ORGANIZATIONS ||--o{ NOTIFICATIONS : owns
  ORGANIZATIONS ||--o{ AUDIT_LOGS : owns

  USERS }o--o{ ROLES : assigned
  ROLES }o--o{ PERMISSIONS : grants

  CATEGORIES ||--o{ PRODUCTS : groups
  PRODUCTS ||--o{ INVENTORY : stocked_as
  WAREHOUSES ||--o{ WAREHOUSE_BINS : contains
  WAREHOUSE_BINS ||--o{ INVENTORY : stores
  PRODUCTS ||--o{ STOCK_MOVEMENTS : changes
  WAREHOUSES ||--o{ STOCK_MOVEMENTS : records

  ORDERS ||--o{ ORDER_ITEMS : contains
  PRODUCTS ||--o{ ORDER_ITEMS : ordered
  ORDERS ||--o{ SHIPMENTS : fulfilled_by
  SHIPMENTS ||--o{ TRACKING_HISTORY : records
```

## Deployment Shape

```mermaid
flowchart LR
  Vercel[Vercel<br/>Frontend] --> APIHost[Render / Railway / DigitalOcean<br/>Backend API]
  APIHost --> ManagedPostgres[(Managed PostgreSQL)]
  APIHost --> ManagedRedis[(Managed Redis)]
  APIHost --> WorkerHost[Worker Process]
  WorkerHost --> ManagedRedis
  WorkerHost --> ManagedPostgres
```

Current local development uses Supabase PostgreSQL and Upstash-compatible Redis connection strings through environment variables. Production deployment is still planned separately.
