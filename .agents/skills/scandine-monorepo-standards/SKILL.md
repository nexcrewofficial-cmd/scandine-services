---
name: scandine-monorepo-standards
description: >-
  Architectural conventions, modular architecture standards, default /api/v1 base prefix rules,
  single-port dev-server, microservice runners, SOLID principles, and engineering standards for the Scan & Dine backend platform.
---

# Scan & Dine Backend Architecture & Engineering Standards

This skill is the canonical engineering manual for the **Scan & Dine Backend Platform**. It governs all domain modules, shared infrastructure, data schemas, routing conventions, development modes, SOLID design principles, and deployment workflows.

---

## 1. Repository Architecture & Directory Topology

The backend is organized as a clean **Modular Architecture (Microservices-Ready)** with a single consolidated `package.json` and `tsconfig.json`:

```text
scan-and-dine-backend/
├── src/
│   ├── modules/                                  # ── BUSINESS DOMAIN MODULES (Feature Folders) ──
│   │   ├── auth/                                 # auth/, users/, customers/, shifts/ (each holds own model, service, controller, interfaces, enums)
│   │   ├── menu/                                 # venues/, categories/, menu-items/, inventory/, promos/, printers/
│   │   ├── orders/                               # orders/, cart/, transactions/, checkout/, kds/, dashboard/, webhooks/
│   │   └── websockets/                           # Socket.io real-time server & event-bus bridge
│   │
│   ├── shared/                                   # ── REUSABLE SHARED INFRASTRUCTURE ──
│   │   ├── types/                                # Canonical TypeScript interfaces, enums, & DTOs
│   │   ├── middlewares/                          # JWT auth, RBAC, Tenancy, Geofence, AppError, Zod validator, asyncHandler
│   │   ├── utils/                                # Standardized responseUtils, successMessage constants
│   │   ├── event-bus/                            # Redis Pub/Sub client with silent local in-memory fallback
│   │   └── logger/                               # Pino JSON structured logging & HTTP request tracing
│   │
│   ├── config/                                   # Centralized environment & payment gateway configs
│   ├── docs/                                     # OpenAPI / Swagger specification JSON
│   └── server.ts                                 # Unified server entrypoint (Port 3000 or Microservice runner)
│
├── .env.example                                  # Environment variables template
├── package.json                                  # Single consolidated package.json
└── tsconfig.json                                 # Single unified TypeScript configuration
```

### Self-Contained Feature Folders Rule (No Redundant Module Barrel Files)
* Every feature folder (e.g. `users/`, `customers/`, `shifts/`, `menu-items/`) is completely self-contained.
* Domain types and enums live directly with the feature: `users/user.interface.ts`, `users/user.enum.ts`, `shifts/shift.interface.ts`.
* Redundant module-level barrel files (such as `auth.enums.ts` and `auth.interfaces.ts`) are **strictly prohibited** to prevent circular dependency chains and maintenance overhead.


---

## 2. SOLID Design Principles in Practice

Every module across the platform adheres strictly to SOLID principles:

### S — Single Responsibility Principle (SRP)
Each file has one, and only one, reason to change:
* **`*.route.ts`**: Pure routing, endpoint path definitions, and middleware attachment. Zero business logic.
* **`*.controller.ts`**: HTTP transport layer wrapped in `errorWrapper` (or `asyncHandler`). Zero manual `try/catch` boilerplate. Unpacks `req.body` and `req.params`, invokes the service, formats HTTP status and standard JSON response. Never executes database queries directly.
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
Subtypes must be substitutable for their base types without altering correctness:
* **Event Bus Handlers**: Event subscribers implement the generic `EventHandler<T>` contract. Any handler can process events without breaking the pub/sub pipeline.
* **Error Hierarchy**: All custom operational errors inherit from `APIError`. The global `errorHandler` processes any `APIError` subclass uniformly.

### I — Interface Segregation Principle (ISP)
Clients should not be forced to depend on methods or fields they do not use:
* **Fine-Grained DTOs**: Create separate Zod schemas and TypeScript DTOs for `CreateStaffDTO`, `UpdateStaffDTO`, `StaffPinLoginDTO`, and `AdminLoginDTO`.
* **Scoped Payloads**: WebSocket room events transmit only the minimum fields required by the receiver (e.g. `waiter` room receives table number + items ready, rather than full customer billing history).

### D — Dependency Inversion Principle (DIP)
High-level modules must not depend on low-level modules; both depend on abstractions:
* **Logger Inversion**: Controllers and services import the abstracted `logger` interface (`@/shared/logger`) rather than instantiating logging libraries directly.
* **Event-Bus Inversion**: Domain modules publish and subscribe through the `publishEvent` and `subscribeToEvent` abstractions. They do not interact directly with raw Redis or in-memory socket instances.

---

## 3. Master Routing & `/api/v1` Base Prefix Standard

### Master Route Aggregation Pattern
Each domain module under `src/modules/<domain>/routes.ts` exports a single master router:
* `src/modules/auth/routes.ts` ➔ exports `authRoutes`
* `src/modules/menu/routes.ts` ➔ exports `menuRoutes`
* `src/modules/orders/routes.ts` ➔ exports `orderRoutes`

### The Rule: Never Repeat `/api/v1/` on Sub-Routes
1. **Sub-Route Files**: Sub-routes inside modules mount at their relative paths:
   ```typescript
   // Correct
   router.post('/admin/login', ...);
   router.get('/public/:venueSlug', ...);

   // WRONG - Do not repeat /api/v1
   router.post('/api/v1/auth/admin/login', ...);
   ```
2. **Master Router**: Mounts sub-routes cleanly:
   ```typescript
   // src/modules/auth/routes.ts
   router.use('/auth', authRouter);
   router.use('/admin/staff', userStaffRouter);
   router.use('/public/auth', customerAuthRouter);
   ```
3. **Application Root**: Mounts the master router once under `/api/v1`:
   ```typescript
   // src/server.ts
   app.use('/api/v1', authRoutes);
   app.use('/api/v1', menuRoutes);
   app.use('/api/v1', orderRoutes);
   ```

---

## 4. Execution Modes: Unified Dev vs Microservices

### A. Unified Dev Server (Default: `npm run dev`)
In local development, all modules, Swagger docs, and WebSockets run on **Port 3000**:
* **Base REST API**: `http://localhost:3000/api/v1/`
* **Swagger UI**: `http://localhost:3000/api/docs`
* **WebSockets**: `ws://localhost:3000`
* **Health Check**: `http://localhost:3000/api/v1/health`

### B. Microservice Runners
To run any domain as an isolated microservice on its dedicated port:
* `npm run start:auth` ➔ Runs only Auth on Port 3001
* `npm run start:menu` ➔ Runs only Menu on Port 3002
* `npm run start:orders` ➔ Runs only Orders on Port 3003
* `npm run start:ws` ➔ Runs only WebSockets on Port 3005

---

## 5. Event-Driven Communication & Graceful Dev Fallback

* **Production**: Real-time events publish across Redis channels for multi-container scaling.
* **Development**: When local Redis is offline, `@/shared/event-bus` silently uses `localEventBus` (Node `EventEmitter`), so all pub/sub events work with zero errors.

---

## 6. Real-Time WebSocket Rooms & Events

* **Namespaces / Rooms**: `venue:{venueId}`, `kds:{venueId}`, `waiter:{venueId}`, `table:{venueId}:{tableNumber}`, `order:{orderId}`
* **Events**: `ORDER_CREATED`, `ORDER_STATUS_CHANGED`, `FOOD_READY`, `TABLE_CALL_WAITER`, `ITEM_86ED`, `ITEM_RESTOCKED`, `CART_SESSION_UPDATED`

---

## 7. Controller Error Wrapping & Response Standardization

### Controller Error Wrapper Pattern (`errorWrapper` / `asyncHandler`)
All asynchronous controller handlers must be wrapped in `errorWrapper` (or its alias `asyncHandler`).
This standard ensures:
1. Every async operation runs inside a standardized `try/catch` execution wrapper.
2. Immediate terminal debugging is printed via `console.error("❌ Controller Error:", ...)`, including third-party API payloads (`err.response?.data`).
3. Structured logging is sent via `logger.error(...)`.
4. The error is cleanly forwarded to Express centralized error handling via `next(err)` without unhandled Promise rejections.

```typescript
import { Request, Response } from "express";
import { errorWrapper, responseUtils, successMessage } from "../../../shared/middlewares/index.js";

export class ExampleController {
  static getData = errorWrapper(async (req: Request, res: Response) => {
    const data = await ExampleService.getData();
    return responseUtils.success(res, {
      data,
      message: successMessage.dataFetched,
      status: 200,
    });
  });
}
```

### Standard Response Envelope Format (`responseUtils` & `successMessage`)
All controller handlers return standardized responses using `responseUtils.success`:
```json
{
  "success": true,
  "message": "Data fetched successfully",
  "data": { ... },
  "meta": { "count": 10 }
}
```

### Response Helpers (`src/shared/utils/response.util.ts`):
- `responseUtils.success(res, { data, message, status, meta })`
- `responseUtils.created(res, { data, message, status, meta })`
- `responseUtils.error(res, { message, status, error })`
- `successMessage` provides typed constants (`dataFetched`, `created`, `updated`, `deleted`, `loginSuccess`, etc.).

---

## 8. OpenAPI Documentation & Postman Auto-Sync

1. **Raw OpenAPI JSON**: Exposed at `GET /api/docs.json` (and Swagger UI at `/api/docs`).
2. **Postman Generator**: Run `npm run postman:gen` to automatically compile `src/docs/openapi.json` into `postman_collection.json`.
3. **Postman Cloud Auto-Sync**: Define `POSTMAN_API_KEY` and `POSTMAN_COLLECTION_UID` in `.env` to push collection changes to the cloud automatically.

---

## 9. String Formatting & Quotation Standard

* **Double Quotes (`"`) Mandatory**: All string literals across the entire codebase (imports, routes, logs, object properties, return messages, enums, etc.) must be written inside double quotes (`"`).
* Avoid single quotes (`'`) in any TypeScript/JavaScript source files.

---

## 10. Centralized Message Constants & Reusable Builders Standard

* **Zero Hardcoded Messages Rule**: Never hardcode user-facing success or error message string literals directly inside controllers, services, or middleware.
* **Reusable Builder Functions (Pass Field/Entity Name First)**:
  Instead of declaring repetitive entries like `orderNotFound`, `tableNotFound`, `menuItemNotFound`, always call the parameterized builder functions by passing the target entity/field name first:
  ```typescript
  // Reusable Error Builders
  errorMessage.notFound("Order")        // "Order not found"
  errorMessage.notFound("Table")        // "Table not found"
  errorMessage.alreadyExists("Table")   // "Table already exists"
  errorMessage.isRequired("Venue ID")   // "Venue ID is required"
  errorMessage.invalid("Manager PIN")   // "Invalid Manager PIN provided"
  errorMessage.alreadyVoided("Order")   // "This order has already been voided"

  // Reusable Success Builders
  successMessage.fetched("Floor map")   // "Floor map fetched successfully"
  successMessage.created("Order")       // "Order created successfully"
  successMessage.updated("KDS Item")    // "KDS Item updated successfully"
  successMessage.deleted("Promo code")  // "Promo code deleted successfully"
  ```
* **Single Source of Truth**: All messages and builders reside in `src/shared/constants/messages.constant.ts` (re-exported via `src/shared/middlewares/index.js` and `src/shared/utils/index.js`).
* **Universal Application (Zero Exceptions)**: Even central handlers like `errorHandler` and middleware pipeline guards must NEVER hardcode strings like `"Validation Error"` or `"Internal Server Error"`. They must reference `errorMessage.validationFailed` and `errorMessage.internalServerError`.
* **Usage in Services (`generateAPIError`)**:
  ```typescript
  import { generateAPIError, errorMessage } from "../../../shared/middlewares/index.js";

  if (!order) {
    return await generateAPIError(errorMessage.notFound("Order"), 404);
  }

  if (cart.items.length === 0) {
    return await generateAPIError(errorMessage.cartEmpty, 400);
  }
  ```
* **Usage in Controllers**:
  ```typescript
  import { responseUtils, successMessage } from "../../../shared/middlewares/index.js";

  return responseUtils.success(res, {
    data,
    message: successMessage.created("Order"),
    status: 201,
  });
  ```
* **Double Quotes (`"`) Mandatory**: Every message definition inside `messages.constant.ts` and codebase must strictly use double quotes.





