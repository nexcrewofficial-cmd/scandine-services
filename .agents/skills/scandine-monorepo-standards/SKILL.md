---
name: scandine-monorepo-standards
description: >-
  Comprehensive architectural conventions, end-to-end code flow, package installation rules,
  frontend/backend directory guide, environment variables reference, and engineering standards
  for the Scan & Dine (scandine) omnichannel restaurant SaaS monorepo.
---

# Scan & Dine Monorepo Architecture, Workflow & Engineering Standards

This skill is the canonical, complete engineering manual for the **Scan & Dine Omnichannel Restaurant SaaS Platform**. It governs all backend microservices, Next.js frontend applications, shared libraries, data schemas, real-time events, environment variables, and deployment workflows.

---

## 1. Monorepo Architecture & Directory Topology

The codebase is organized as a **Turborepo TypeScript Monorepo** managed with `npm` workspaces.

```text
scan-and-dine-monorepo/
│
├── apps/
│   ├── server/                          # ── BACKEND MICROSERVICES ──
│   │   ├── api-gateway/ (Port 3000)     # Reverse proxy, rate limiter, CORS, Swagger (/api/docs)
│   │   ├── service-auth/ (Port 3001)    # Auth, staff 4-digit PINs, RBAC, shift logs, device UUID
│   │   ├── service-menu/ (Port 3002)    # Menu CMS, categories, items, modifiers, 86-ing toggles, inventory
│   │   ├── service-orders/ (Port 3003)  # Cart, checkout, Stripe payment intents, KDS SLA timers, ledger
│   │   └── service-websockets/ (Port 3005) # Socket.io + Redis Pub/Sub adapter, real-time rooms
│   │
│   ├── web/ (Port 4000)                 # Customer Scan-to-Order Next.js 15 PWA
│   ├── waiter/ (Port 4001)              # Staff Floor Map & Live Cart Mirror Next.js 15 App
│   └── admin/ (Port 4002)               # Venue Manager CMS, Analytics & QR Next.js 15 App
│
├── packages/                            # ── SHARED WORKSPACES ──
│   ├── shared-types/                    # Canonical TypeScript interfaces, enums, & DTOs
│   ├── shared-middlewares/              # JWT, RBAC, Tenancy, AppError, Zod validator
│   ├── event-bus/                       # Redis Pub/Sub client with graceful offline fallback
│   ├── logger/                          # Pino JSON structured logging & HTTP request tracing
│   └── ui-components/                   # Shared Tailwind UI components (Button, Modal, Input, Badges)
│
├── turbo.json                           # Turborepo task pipeline configuration
├── package.json                         # Root monorepo workspaces configuration
└── .env.example                         # Environment variable definitions template
```

### Communication Topology
```text
[Customer PWA: 4000]   [Waiter App: 4001]   [Admin Dashboard: 4002]
         │                      │                      │
         │ (HTTP REST)          │ (HTTP REST)          │ (HTTP REST)
         ▼                      ▼                      ▼
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

### Phase 1: Customer Scans Table QR Code
1. Customer camera scans Table QR Code: `https://dine.example.com/{venueSlug}?table=5`.
2. `apps/web` loads menu from Gateway: `GET /api/v1/public/menu/:venueSlug`.
3. Gateway proxies to `service-menu` (`Port 3002`).
4. `service-menu` retrieves categories, items, and active modifiers where `isActive: true` and `deletedAt: null`.

### Phase 2: Ordering & Real-Time Sync
1. Customer customizes items and submits cart: `POST /api/v1/public/checkout/cash` (or Stripe intent).
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
4. `service-websockets` broadcasts to waiter & customer:
   - Waiter tablet shows green alert badge.
   - Customer phone displays "Your food is ready!".

### Phase 4: Waiter Settlement & 86-ing Stock
1. If a dish sells out, kitchen or manager marks it unavailable: `PATCH /api/v1/admin/menu/items/:id/availability`.
2. `service-menu` publishes `EventChannels.ITEM_86ED`.
3. `service-websockets` broadcasts to `venue:{venueId}`:
   - Customer phone grays out item instantly without page reload.
   - Waiter tablet disables selection immediately.

---

## 3. Where to Write Code (Directory Guide)

### A. Backend Code (`apps/server/<service>/`)
All backend microservices strictly use the **Domain Feature-Module Pattern**:

```text
apps/server/<service-name>/src/
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

### B. Frontend Code (`apps/web/`, `apps/waiter/`, `apps/admin/`)
All frontends are **Next.js 15 (App Router)** applications:

```text
apps/<app-name>/src/
├── app/                         # Next.js App Router pages & layouts
│   ├── layout.tsx               # Root HTML structure, toast providers, navbar
│   ├── page.tsx                 # Entry page
│   └── [subRoutes]/page.tsx     # e.g., /tables, /menu, /kds, /settings
├── components/                  # Application-specific UI components
│   ├── forms/                   # Form modals, input fields
│   ├── layout/                  # Sidebar, header, bottom navigation bar
│   └── views/                   # KDS Kanban board, floor map grid, cart sidebar
├── hooks/                       # Custom React hooks (useSocket, useCart, useAuth)
├── lib/                         # External client configurations:
│   ├── api.ts                   # Axios client instance pointed to NEXT_PUBLIC_API_URL
│   └── socket.ts                # Socket.io client instance pointed to NEXT_PUBLIC_SOCKET_URL
└── store/                       # State management (Zustand / Context)
```

### C. Shared Code (`packages/`)
* **`packages/shared-types`**:
  * Write canonical interfaces (`IOrder`, `IMenuItem`, `IUser`).
  * Write request DTOs (`CreateOrderDTO`, `UpdateMenuItemDTO`).
  * Write Enums (`UserRole`, `OrderStatus`, `PaymentStatus`, `TableStatus`).
* **`packages/shared-middlewares`**:
  * Write auth guards (`authenticateJwt`, `requireRole`, `requireVenueId`).
  * Write error handlers (`errorHandler`, `AppError`).
  * Write Zod schema validation middlewares (`validateRequest`).
* **`packages/ui-components`**:
  * Write shared UI primitives used across at least two frontends (`Button`, `Input`, `Modal`, `Badge`, `StatusBadge`, `LoadingSpinner`).
* **`packages/event-bus`**:
  * Redis Pub/Sub events, channel constants (`EventChannels`), typed dispatchers.
* **`packages/logger`**:
  * Pino structured JSON logging configuration and HTTP request logger middleware.

---

## 4. Package Installation Cheat Sheet (Strict Workspaces)

> [!CAUTION]
> **NEVER** run `npm install <pkg>` at root without targeting a workspace. It pollutes the root `node_modules` and breaks Turborepo caching.

| Goal | Exact Command (Run from Monorepo Root) |
| :--- | :--- |
| Add package to **API Gateway** | `npm install <pkg> -w @scan-and-dine/api-gateway` |
| Add package to **Auth Service** | `npm install <pkg> -w @scan-and-dine/service-auth` |
| Add package to **Menu Service** | `npm install <pkg> -w @scan-and-dine/service-menu` |
| Add package to **Orders Service** | `npm install <pkg> -w @scan-and-dine/service-orders` |
| Add package to **WebSockets Service** | `npm install <pkg> -w @scan-and-dine/service-websockets` |
| Add package to **Customer Web App** | `npm install <pkg> -w @scan-and-dine/web` |
| Add package to **Waiter App** | `npm install <pkg> -w @scan-and-dine/waiter` |
| Add package to **Admin Dashboard** | `npm install <pkg> -w @scan-and-dine/admin` |
| Add package to **Shared Types** | `npm install <pkg> -w @scan-and-dine/shared-types` |
| Add package to **Shared Middlewares**| `npm install <pkg> -w @scan-and-dine/shared-middlewares` |
| Add package to **Shared UI Components**| `npm install <pkg> -w @scan-and-dine/ui-components` |
| Add TypeScript `@types` | Append `-D` (e.g. `npm install -D @types/qrcode -w @scan-and-dine/admin`) |
| Add root dev tool (Prettier, Turbo)| `npm install -D <pkg>` *(no `-w` flag)* |

---

## 5. Complete Environment Variables Reference (`.env`)

Every environment variable and which service consumes it:

```ini
# ========================================================
# GENERAL ENVIRONMENT
# ========================================================
NODE_ENV=development                       # 'development' | 'production' | 'test'

# ========================================================
# DATABASE (Consumed by service-auth, service-menu, service-orders)
# ========================================================
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/scan-and-dine?retryWrites=true&w=majority
MONGO_MAX_POOL_SIZE=20                     # Safe pool limit for MongoDB Atlas free/shared tiers

# ========================================================
# REDIS & EVENT BUS (Consumed by event-bus, service-websockets)
# ========================================================
REDIS_HOST=127.0.0.1                       # Redis host
REDIS_PORT=6379                            # Redis port
REDIS_PASSWORD=                            # Optional password (leave blank for local dev)

# ========================================================
# JWT AUTHENTICATION (Consumed by service-auth, shared-middlewares)
# ========================================================
JWT_SECRET=super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=1d                          # Staff & Admin session lifespan
JWT_REFRESH_SECRET=super_secret_refresh_key_change_in_production
JWT_REFRESH_EXPIRES_IN=7d                  # Refresh token lifespan

# ========================================================
# BACKEND MICROSERVICE PORTS
# ========================================================
PORT_GATEWAY=3000                          # Public REST Gateway & Swagger UI
PORT_AUTH=3001                             # Internal Auth Microservice
PORT_MENU=3002                             # Internal Menu Microservice
PORT_ORDERS=3003                           # Internal Orders & KDS Microservice
PORT_WEBSOCKETS=3005                       # Real-Time Socket.io Microservice

# ========================================================
# FRONTEND APPLICATION PORTS
# ========================================================
PORT_WEB_CUSTOMER=4000                     # Customer Scan-to-Order PWA
PORT_WEB_WAITER=4001                       # Waiter Floor Staff Tablet App
PORT_WEB_ADMIN=4002                        # Venue Admin Portal

# ========================================================
# GATEWAY PROXY DESTINATIONS (Consumed by api-gateway)
# ========================================================
URL_SERVICE_AUTH=http://localhost:3001     # Local or Docker internal DNS
URL_SERVICE_MENU=http://localhost:3002
URL_SERVICE_ORDERS=http://localhost:3003
URL_SERVICE_WEBSOCKETS=http://localhost:3005

# ========================================================
# FRONTEND PUBLIC CLIENT VARIABLES (Consumed by apps/web, apps/waiter, apps/admin)
# ========================================================
NEXT_PUBLIC_API_URL=http://localhost:3000   # Frontends point REST calls here
NEXT_PUBLIC_SOCKET_URL=http://localhost:3005 # Frontends point WebSocket client here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# ========================================================
# PAYMENT GATEWAY (Consumed by service-orders)
# ========================================================
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# ========================================================
# STRUCTURED LOGGING (Consumed by logger package)
# ========================================================
LOG_LEVEL=info                             # 'debug' | 'info' | 'warn' | 'error'
```

---

## 6. Backend Coding Standards & Rules

### 1. Mandatory ESM Imports with `.js` Extension
Since backend packages use `"type": "module"`, all relative TypeScript imports **must** include the `.js` extension:
```typescript
// ✅ CORRECT:
import { CategoryService } from './category.service.js';
import { CategoryModel } from './category.model.js';

// ❌ WRONG (Fails at runtime):
import { CategoryService } from './category.service';
```

### 2. Multi-Tenancy & Data Isolation
* All route handlers must enforce:
  ```typescript
  router.use(authenticateJwt);
  router.use(requireVenueId);
  router.use(requireRole(UserRole.VENUE_ADMIN, UserRole.MANAGER));
  ```
* Every query **must** filter by `venueId: req.venueId`:
  ```typescript
  // ✅ CORRECT:
  const items = await MenuItemModel.find({ venueId: req.venueId, deletedAt: null });

  // ❌ ILLEGAL (Data leak risk):
  const items = await MenuItemModel.find({ _id: itemId });
  ```

### 3. Concurrency Protection (Optimistic Locking)
State transitions on critical resources (orders, payments, inventory) must use document versioning:
```typescript
const updatedOrder = await OrderModel.findOneAndUpdate(
  { _id: orderId, venueId, version: currentVersion },
  { $set: updates, $inc: { version: 1 } },
  { new: true }
);

if (!updatedOrder) {
  throw AppError.conflict('Order was updated by another staff member. Please refresh.');
}
```

### 4. Standard Error Handling
* Always throw `AppError` from `@scan-and-dine/shared-middlewares`:
  ```typescript
  throw AppError.notFound('Resource not found');
  throw AppError.badRequest('Invalid payload');
  throw AppError.unauthorized('Invalid PIN');
  throw AppError.forbidden('Access denied');
  throw AppError.conflict('State conflict');
  ```
* Always wrap controller logic in `try / catch` and forward to `next(err)`:
  ```typescript
  static async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Logic
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
  ```

---

## 7. Frontend Engineering Standards

### 1. Unified API Client
All REST API calls must use a central Axios client configured with `NEXT_PUBLIC_API_URL`:
```typescript
// apps/admin/src/lib/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 2. Unified WebSocket Client
Connect to `service-websockets` on `NEXT_PUBLIC_SOCKET_URL`:
```typescript
// apps/waiter/src/hooks/useSocket.ts
import { io } from 'socket.io-client';

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3005', {
  transports: ['websocket'],
});

// Join venue room on mount:
socket.emit('join_venue', { venueId });
socket.on('order_created', (data) => { /* update table grid */ });
```

### 3. Shared UI Components
* Always import shared buttons, cards, modals, and badges from `@scan-and-dine/ui-components`:
  ```typescript
  import { Button, Input, Modal, StatusBadge } from '@scan-and-dine/ui-components';
  ```

---

## 8. Build, Dev & Production Workflows

### Running in Development
* **Run Everything Concurrently**:
  ```bash
  npm run dev
  ```
* **Run Targeted Functional Stack** (Save Memory / Low RAM):
  ```bash
  # Customer Flow:
  npx turbo run dev --filter=@scan-and-dine/web --filter=@scan-and-dine/api-gateway --filter=@scan-and-dine/service-menu

  # Kitchen & Waiter Flow:
  npx turbo run dev --filter=@scan-and-dine/waiter --filter=@scan-and-dine/api-gateway --filter=@scan-and-dine/service-orders --filter=@scan-and-dine/service-websockets
  ```

### Building for Production
```bash
npm run build
```
Turborepo automatically compiles shared packages first (`shared-types`, `shared-middlewares`, `ui-components`), builds microservices into `dist/`, and builds Next.js apps into `.next/`.

### Production Process Management (PM2)
```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

---

## 9. Step-by-Step Checklist for Adding Any Feature

Follow these 9 steps sequentially whenever introducing a new model, route, or feature:

1. **Shared Types**: Add interface, DTO, and enums in `packages/shared-types/src/`.
2. **Recompile Types**: Run `npm run build -w @scan-and-dine/shared-types`.
3. **Mongoose Model**: Create `<feature>.model.ts` with `{ venueId: 1, ... }` compound indexes and soft deletion (`deletedAt: null`).
4. **Validation**: Create `<feature>.validation.ts` with Zod schemas.
5. **Business Service**: Create `<feature>.service.ts` with multi-tenant scoped queries, optimistic locking (`version`), and event publishing.
6. **Controller**: Create `<feature>.controller.ts` with `try / catch (err) { next(err); }`.
7. **Router**: Create `<feature>.route.ts`, apply `authenticateJwt` & `requireVenueId`, and mount in the microservice `server.ts`.
8. **Gateway Proxy**: If a new URL prefix was introduced, add it to `apps/server/api-gateway/src/proxy/proxy-routes.ts`.
9. **Frontend Integration**: Call endpoint from `apps/<app>/src/` using the standard `api` client and listen for socket events if real-time.
