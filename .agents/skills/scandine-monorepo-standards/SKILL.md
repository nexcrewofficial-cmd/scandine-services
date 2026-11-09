---
name: scandine-monorepo-standards
description: >-
  Architectural conventions, master routing standards, default /api/v1 base prefix rules,
  single-port dev-server, SOLID principles, and engineering standards for the Scan & Dine backend microservices platform.
---

# Scan & Dine Backend Microservices Architecture & Engineering Standards

This skill is the canonical engineering manual for the **Scan & Dine Backend Platform**. It governs all backend microservices, shared libraries, data schemas, routing conventions, development modes, SOLID design principles, and deployment workflows.

---

## 1. Repository Architecture & Directory Topology

The backend is organized with `server/` and `packages/` workspaces:

```text
scan-and-dine-backend/
│
├── server/                                   # ── BACKEND MICROSERVICES ──
│   ├── api-gateway/ (Port 3000)              # Public reverse proxy, rate limiter, CORS, Swagger (/api/docs)
│   ├── service-auth/ (Port 3001)             # Users, RBAC, 4-digit PIN login, HR shifts, device UUID
│   ├── service-menu/ (Port 3002)             # Menu CMS, categories, items, modifiers, 86-ing toggles, inventory
│   ├── service-orders/ (Port 3003)           # Cart, checkout, Stripe payment intents, KDS SLA timers, ledger
│   ├── service-websockets/ (Port 3005)       # Socket.io + Redis Pub/Sub adapter, real-time rooms
│   └── dev-server.ts                         # Unified Single-Port (3000) Dev Server for instant local dev
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

---

## 2. SOLID Design Principles in Practice

Every module, class, and service across the platform must adhere strictly to SOLID principles:

### S — Single Responsibility Principle (SRP)
Each file has one, and only one, reason to change:
* **`*.route.ts`**: Pure routing, endpoint path definitions, and middleware attachment. Zero business logic.
* **`*.controller.ts`**: HTTP transport layer. Unpacks `req.body` and `req.params`, invokes the service, formats HTTP status and standard JSON response. Never executes database queries directly.
* **`*.service.ts`**: Domain business logic, atomic state transitions, event dispatching, and database interactions.
* **`*.model.ts`**: Mongoose document schemas, compound indexes, and lifecycle hooks.
* **`*.validation.ts`**: Pure Zod input validation schemas.
* **`*.utils.ts`**: Pure calculation helper functions (e.g. tax, discount calculations, order number generation).

### O — Open / Closed Principle (OCP)
Open for extension, closed for modification:
* **Event-Driven Side Effects**: When an order is placed, `OrderService` publishes `ORDER_CREATED`. Future features (SMS alerts, thermal printing, analytics tracking, external POS sync) subscribe to the event bus **without** altering or bloating `OrderService`.
* **Modifier & Pricing Extensibility**: Dishes support dynamic modifier groups (variants, mandatory single-choice, optional add-ons) driven by configuration rather than brittle `if/else` logic.
* **Middleware Pipelines**: New guards (e.g. geofencing, subscription tier checks) are composed into route pipelines without modifying existing route handlers.

### L — Liskov Substitution Principle (LSP)
Subtypes must be substitutable for their base types without altering system correctness:
* **`AppError` Hierarchy**: Custom error classes (`AppError.notFound`, `AppError.badRequest`, `AppError.conflict`) all inherit from the standard base error class and adhere to `{ statusCode, message, isOperational }`. The global error middleware treats all errors consistently.
* **Interface Contracts**: Mongoose documents implement canonical interfaces from `@scan-and-dine/shared-types` (e.g. `IOrderDocument extends IOrder`), ensuring they can be passed anywhere an `IOrder` is expected.

### I — Interface Segregation Principle (ISP)
Clients must not be forced to depend on interfaces they do not use:
* **Fine-Grained DTOs**: Never use full database entity models for request validation. Create focused, granular DTOs in `packages/shared-types`:
  * `CreateOrderDTO` (only fields needed to submit an order)
  * `UpdateMenuItemDTO` (only updatable catalog fields)
  * `LoginPINStaffDTO` (only `venueId` and `pinCode`)
* **Role-Specific Views**: Separate customer-facing DTOs (sanitized, active items only) from admin-facing DTOs (cost margins, supplier info, internal tags).

### D — Dependency Inversion Principle (DIP)
High-level modules must depend on abstractions, not concrete low-level implementations:
* **Shared Type Contracts**: Services and controllers depend on TypeScript interfaces and enums from `@scan-and-dine/shared-types`, not on each other's internal database models.
* **Infrastructure Abstractions**:
  * Logging is abstracted behind `@scan-and-dine/logger` (Pino). Services log via `logger.info()` without binding to log transports.
  * Messaging is abstracted behind `@scan-and-dine/event-bus`. Services call `publishEvent(channel, data)` without managing Redis socket pools or clustering.

---

## 3. Master Routing Standards & The `/api/v1` Base Prefix Rule

### 🚫 The Anti-Pattern: Never Repeat `/api/v1/`
Never repeat the string `/api/v1/` on individual route declarations across multiple files.

### ✅ The Standard Pattern:
1. **Sub-Route Modules** define their endpoints cleanly:
   ```typescript
   // e.g., modules/categories/category.route.ts
   router.get('/', CategoryController.list);
   router.post('/', CategoryController.create);
   ```

2. **Master Service Router** (`server/<service>/src/routes.ts`):
   Each microservice aggregates its domain routes **without** the `/api/v1` prefix:
   ```typescript
   // server/service-menu/src/routes.ts
   import { Router } from 'express';
   const router = Router();

   router.use('/admin/settings', venueRouter);
   router.use('/admin/menu/categories', categoryRouter);
   router.use('/admin/menu/items', menuItemRouter);
   router.use('/public/menu', menuItemRouter);
   router.use('/admin/inventory', inventoryRouter);
   router.use('/admin/promos', promoRouter);
   router.use('/admin/printers', printerRouter);

   export const menuRoutes = router;
   ```

3. **Master Base Prefix**:
   Mount `/api/v1` **once as the default prefix**:
   * **In each standalone microservice (`server.ts`)**:
     ```typescript
     app.use('/api/v1', menuRoutes);
     ```
   * **In the unified development server (`server/dev-server.ts`)**:
     ```typescript
     const apiV1Router = Router();
     apiV1Router.use(authRoutes);
     apiV1Router.use(menuRoutes);
     apiV1Router.use(orderRoutes);

     app.use('/api/v1', apiV1Router);
     ```

---

## 4. End-to-End System & Code Flow

### Phase 1: Menu & Catalog Discovery
1. Client requests menu: `GET /api/v1/public/menu/:venueSlug`.
2. Router forwards to `service-menu` (`Port 3002` or unified dev-server).
3. `service-menu` retrieves categories, items, and active modifiers where `isActive: true` and `deletedAt: null`.

### Phase 2: Ordering & Real-Time Sync
1. Client submits cart: `POST /api/v1/public/checkout/cash` (or Stripe payment intent).
2. Request processed by `service-orders`:
   - Calculates financial totals (tax, subtotal, tip).
   - Generates sequential order number.
   - Saves order document with `version: 0` and `status: SENT_TO_KITCHEN`.
   - Calls `publishEvent(EventChannels.ORDER_CREATED, { venueId, orderId, tableNumber, ... })`.
3. WebSocket Engine receives Redis event:
   - Emits `order_created` to room `kds:{venueId}` (Kitchen display chimes).
   - Emits `table_status_changed` to room `venue:{venueId}` (Waiter tablet highlights table yellow).

### Phase 3: Kitchen Cooking & Completion
1. Kitchen chef marks item/ticket ready: `PATCH /api/v1/kds/tickets/:id/status` (`READY`).
2. `service-orders` increments document version (`$inc: { version: 1 }`).
3. Dispatches `EventChannels.FOOD_READY`.
4. WebSocket Engine broadcasts to waiter and customer rooms.

### Phase 4: Waiter Settlement & 86-ing Stock
1. If a dish sells out, kitchen marks it unavailable: `PATCH /api/v1/admin/menu/items/:id/availability`.
2. `service-menu` publishes `EventChannels.ITEM_86ED`.
3. WebSocket Engine broadcasts to `venue:{venueId}`:
   - All connected customer apps gray out the item instantly.
   - Waiter tablets disable item selection immediately.

---

## 5. Where to Write Code (Directory Guide)

### A. Microservices Code (`server/<service>/`)
All backend microservices strictly use the **Domain Feature-Module Pattern**:

```text
server/<service-name>/src/
├── config/                      # env.ts, database.ts
├── modules/
│   └── <featureName>/           # e.g. orders, categories, staff, kds
│       ├── <feature>.route.ts       # Express route handlers, auth guards (SRP: Routing only)
│       ├── <feature>.controller.ts  # Request body/param extraction (SRP: HTTP transport only)
│       ├── <feature>.service.ts     # Business logic, DB operations, events (SRP: Domain rules only)
│       ├── <feature>.model.ts       # Mongoose Schema & multi-tenant indexes (SRP: Data schema only)
│       ├── <feature>.validation.ts  # Zod schemas for input validation (SRP: Validation only)
│       └── <feature>.utils.ts       # Pure helper functions (SRP: Calculations only)
├── routes.ts                    # Master Service Router (Exports <service>Routes)
└── server.ts                    # Microservice entry point & /api/v1 mount
```

### B. Shared Libraries (`packages/`)
* **`packages/shared-types`**: Canonical interfaces (`IOrder`, `IMenuItem`, `IUser`), request DTOs (`CreateOrderDTO`), and Enums (`UserRole`, `OrderStatus`).
* **`packages/shared-middlewares`**: Auth guards (`authenticateJwt`, `requireRole`, `requireVenueId`), error handlers (`errorHandler`, `AppError`), and Zod validation middlewares (`validateRequest`).
* **`packages/event-bus`**: Redis Pub/Sub events, channel constants (`EventChannels`), and offline dev fallback.
* **`packages/logger`**: Pino structured JSON logging and HTTP request logger middleware.

---

## 6. Development & Production Operations

### 1. Single-Port Development Mode (Recommended for Local Dev)
Run all REST APIs, Swagger docs, and WebSockets on **Port 3000** in one terminal:
```bash
npm run dev
```
* **Base REST API**: `http://localhost:3000/api/v1/`
* **Swagger Docs**: `http://localhost:3000/api/docs`
* **WebSockets**: `ws://localhost:3000` (attached on same port)
* **Health Check**: `http://localhost:3000/api/v1/health`

### 2. Multi-Port Microservices Mode
Run all 5 microservices as independent isolated processes (Ports 3000, 3001, 3002, 3003, 3005):
```bash
npm run dev:microservices
```

Or run any single service individually:
```bash
npm run dev:gateway   # Port 3000
npm run dev:auth      # Port 3001
npm run dev:menu      # Port 3002
npm run dev:orders    # Port 3003
npm run dev:ws        # Port 3005
```

### 3. Production Deployment (PM2)
```bash
npm run build
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

---

## 7. Multi-Tenancy & Concurrency Rules

1. **Mandatory `venueId` Scoping**:
   Every database query, insertion, update, or deletion **must** filter by `{ venueId: req.venueId }`:
   ```typescript
   // ✅ CORRECT:
   const items = await MenuItemModel.find({ venueId: req.venueId, deletedAt: null });

   // ❌ ILLEGAL (Data leak risk):
   const items = await MenuItemModel.find({ _id: itemId });
   ```

2. **Optimistic Concurrency Locking**:
   State transitions on orders and payments must use document versioning with atomic `$inc: { version: 1 }`:
   ```typescript
   const updated = await OrderModel.findOneAndUpdate(
     { _id: orderId, venueId, version: currentVersion },
     { $set: updates, $inc: { version: 1 } },
     { new: true }
   );
   if (!updated) {
     throw AppError.conflict('Order was modified by another staff member. Please refresh.');
   }
   ```
