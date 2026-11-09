---
name: scandine-monorepo-standards
description: >-
  Architectural conventions, end-to-end code flow, package installation rules,
  server/ and packages/ directory guide, environment variables reference, and engineering standards
  for the Scan & Dine backend microservices platform.
---

# Scan & Dine Backend Microservices Architecture & Engineering Standards

This skill is the canonical engineering manual for the **Scan & Dine Backend Microservices Platform**. It governs all backend microservices, shared libraries, data schemas, real-time events, environment variables, and deployment workflows.

---

## 1. Repository Architecture & Directory Topology

The backend is organized with `server/` and `packages/` workspaces:

```text
scan-and-dine-backend/
│
├── server/                                   # ── BACKEND MICROSERVICES ──
│   ├── api-gateway/ (Port 3000)              # Reverse proxy, rate limiter, CORS, Swagger (/api/docs)
│   ├── service-auth/ (Port 3001)             # Auth, staff 4-digit PINs, RBAC, shift logs, device UUID
│   ├── service-menu/ (Port 3002)             # Menu CMS, categories, items, modifiers, 86-ing toggles, inventory
│   ├── service-orders/ (Port 3003)           # Cart, checkout, Stripe payment intents, KDS SLA timers, ledger
│   └── service-websockets/ (Port 3005)       # Socket.io + Redis Pub/Sub adapter, real-time rooms
│
├── packages/                                 # ── SHARED LIBRARIES ──
│   ├── shared-types/                         # Canonical TypeScript interfaces, enums, & DTOs
│   ├── shared-middlewares/                   # JWT, RBAC, Tenancy, AppError, Zod validator
│   ├── event-bus/                            # Redis Pub/Sub client with graceful offline fallback
│   └── logger/                               # Pino JSON structured logging & HTTP request tracing
│
├── ecosystem.config.cjs                      # Production PM2 Cluster Configuration
├── package.json                              # Dedicated backend workspaces & concurrently runners
└── tsconfig.base.json                        # Shared TypeScript base configuration
```

### Communication Topology
```text
[External Clients / Frontends]
         │
         │ (HTTP REST)
         ▼
┌─────────────────────────────────────────────────────────────┐
│                 API GATEWAY (Port 3000)                     │
│  - Reverse Proxy (http-proxy-middleware)                    │
│  - Rate Limiter (300 req/min)                               │
│  - Helmet & CORS Policies                                   │
│  - Swagger OpenAPI Docs (/api/docs)                         │
└──────┬───────────────────────┬───────────────────────┬──────┘
       │                       │                       │
       ▼                       ▼                       ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│ service-auth │       │ service-menu │       │service-orders│
│  (Port 3001) │       │  (Port 3002) │       │  (Port 3003) │
└──────┬───────┘       └──────┬───────┘       └──────┬───────┘
       │                      │                      │
       └──────────────────────┼──────────────────────┘
                              │
                    (Redis Event Bus Pub)
                              │
                              ▼
                ┌───────────────────────────┐
                │ service-websockets (3005) │◄─── (Socket.io Direct)
                │  - Broadcasts to Rooms    │     Customer, Waiter, KDS
                └───────────────────────────┘
```

---

## 2. End-to-End System & Code Flow

### Phase 1: Menu & Catalog Discovery
1. Client requests menu: `GET /api/v1/public/menu/:venueSlug`.
2. Gateway proxies to `service-menu` (`Port 3002`).
3. `service-menu` retrieves categories, items, and active modifiers where `isActive: true` and `deletedAt: null`.

### Phase 2: Ordering & Real-Time Sync
1. Client submits cart: `POST /api/v1/public/checkout/cash` (or Stripe payment intent).
2. Gateway proxies to `service-orders` (`Port 3003`).
3. `service-orders`:
   - Calculates financial totals (tax, subtotal, tip).
   - Generates sequential order number.
   - Saves order document with `version: 0` and `status: SENT_TO_KITCHEN`.
   - Calls `publishEvent(EventChannels.ORDER_CREATED, { venueId, orderId, tableNumber, ... })`.
4. `service-websockets` (`Port 3005`) receives Redis event:
   - Emits `order_created` to room `kds:{venueId}` (Kitchen display chimes).
   - Emits `table_status_changed` to room `venue:{venueId}` (Waiter tablet highlights table yellow).

### Phase 3: Kitchen Cooking & Completion
1. Kitchen chef marks item/ticket ready: `PATCH /api/v1/kds/tickets/:id/status` (`READY`).
2. `service-orders` increments document version (`$inc: { version: 1 }`).
3. Dispatches `EventChannels.FOOD_READY`.
4. `service-websockets` broadcasts to waiter & customer rooms.

### Phase 4: Waiter Settlement & 86-ing Stock
1. If a dish sells out, kitchen or manager marks it unavailable: `PATCH /api/v1/admin/menu/items/:id/availability`.
2. `service-menu` publishes `EventChannels.ITEM_86ED`.
3. `service-websockets` broadcasts to `venue:{venueId}`:
   - All connected customer apps gray out the item instantly.
   - Waiter tablets disable item selection immediately.

---

## 3. Where to Write Code (Directory Guide)

### A. Microservices Code (`server/<service>/`)
All backend microservices strictly use the **Domain Feature-Module Pattern**:

```text
server/<service-name>/src/
├── config/                      # env.ts, database.ts
├── modules/
│   └── <featureName>/           # e.g. orders, categories, staff, kds
│       ├── <feature>.route.ts       # Express route handlers, auth guards
│       ├── <feature>.controller.ts  # Request body/param extraction, response formatting
│       ├── <feature>.service.ts     # Business logic, DB operations, event publishing
│       ├── <feature>.model.ts       # Mongoose Schema & multi-tenant indexes
│       ├── <feature>.validation.ts  # Zod schemas for input validation
│       └── <feature>.utils.ts       # (Optional) Domain pure helper functions
├── proxy/                       # (Only in api-gateway) proxy-routes.ts
└── server.ts                    # Express bootstrap & route mounting
```

### B. Shared Libraries (`packages/`)
* **`packages/shared-types`**: Canonical interfaces (`IOrder`, `IMenuItem`, `IUser`), request DTOs (`CreateOrderDTO`), and Enums (`UserRole`, `OrderStatus`).
* **`packages/shared-middlewares`**: Auth guards (`authenticateJwt`, `requireRole`, `requireVenueId`), error handlers (`errorHandler`, `AppError`), and Zod validation middlewares (`validateRequest`).
* **`packages/event-bus`**: Redis Pub/Sub events, channel constants (`EventChannels`), and offline dev fallback.
* **`packages/logger`**: Pino structured JSON logging and HTTP request logger middleware.

---

## 4. Package Installation Cheat Sheet (Workspaces)

Install packages from the root using `-w`:

```bash
# Add package to a microservice:
npm install <pkg> -w @scan-and-dine/service-orders
npm install <pkg> -w @scan-and-dine/service-auth
npm install <pkg> -w @scan-and-dine/service-menu
npm install <pkg> -w @scan-and-dine/service-websockets
npm install <pkg> -w @scan-and-dine/api-gateway

# Add package to shared libraries:
npm install <pkg> -w @scan-and-dine/shared-types
npm install <pkg> -w @scan-and-dine/shared-middlewares
```

---

## 5. Development & Production Operations

### Running in Development
* **Start all 5 microservices concurrently**:
  ```bash
  npm run dev
  ```
* **Start individual microservices**:
  ```bash
  npm run dev:gateway
  npm run dev:auth
  npm run dev:menu
  npm run dev:orders
  npm run dev:ws
  ```

### Building All Services
```bash
npm run build
```

### Production with PM2
```bash
npm run build
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```
