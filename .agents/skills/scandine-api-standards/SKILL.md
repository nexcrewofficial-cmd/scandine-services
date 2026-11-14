---
name: scandine-api-standards
description: >-
  Architectural guidelines and standards for building RESTful APIs, request validation with Zod,
  controller error wrapping, response standardization with responseUtils, and OpenAPI documentation in Scan & Dine.
---

# Scan & Dine API Standards & Controller Patterns

This skill defines the canonical rules for developing, validating, wrapping, and documenting RESTful endpoints across the **Scan & Dine** backend platform.

---

## 1. Purpose and Scope

This skill governs:
- API endpoint routing conventions and prefix structuring.
- Input validation patterns using **Zod**.
- Controller execution safety using `errorWrapper` (`asyncHandler`).
- Standardized HTTP response envelopes using `responseUtils`.
- Centralized message builder consumption (`messages.constant.ts`).
- Interactive Swagger UI and automated Postman collection generation.

---

## 2. Relevant Project Architecture & File Paths

- **Shared Middlewares**: `src/shared/middlewares/`
  - `errorWrapper` / `asyncHandler`: `src/shared/middlewares/async-handler.ts`
  - `validateRequest` / `validateBody`: `src/shared/middlewares/validate.middleware.ts`
  - `errorHandler`: `src/shared/middlewares/error-handler.middleware.ts`
  - `AppError`: `src/shared/middlewares/app-error.ts`
- **Response Utilities**: `src/shared/utils/response.util.ts`
- **Centralized Messages**: `src/shared/constants/messages.constant.ts`
- **API Documentation**:
  - OpenAPI 3.0 specification: `src/docs/openapi.json`
  - Postman generator script: `scripts/generate-postman.ts`
  - Generated Postman file: `postman_collection.json`

---

## 3. Existing Coding Conventions

1. **Double Quotes (`"`) Mandatory**: All endpoint paths, HTTP verbs, error messages, and JSON keys must use double quotes (`"`).
2. **Master Routing `/api/v1` Standard**:
   - Sub-route files define relative paths (e.g. `router.get("/floor-map", ...)`).
   - Domain routers group sub-routes (e.g. `router.use("/waiter", waiterRouter)`).
   - `server.ts` mounts domain routers once under `/api/v1` (e.g. `app.use("/api/v1", orderRoutes)`).
   - **Never write `/api/v1/` inside sub-route files.**
3. **No Manual Try/Catch in Controllers**: Every controller method must be wrapped in `errorWrapper`.
4. **Zero Hardcoded Messages**: Always use `successMessage.<key>`, `successMessage.<builder>()`, `errorMessage.<key>`, or `errorMessage.<builder>()`.
5. **Strict TypeScript Typing (Zero `any` Standard)**:
   - Never use `as any` or raw untyped `any` when proper types or interfaces can be declared or reused.
   - Always reuse existing interfaces/types (`JwtAuthPayload`, `AuthenticatedUser`, `SignOptions`, domain DTOs) from `src/shared/types` or domain `*.interface.ts`.
   - Explicitly type third-party library options (e.g., `SignOptions["expiresIn"]`) and cast decoded payloads to verified interface structures.

---

## 4. The Controller Pattern (`errorWrapper` & `responseUtils`)

### Standard Controller Template
```typescript
import { Request, Response } from "express";
import { ExampleService } from "./example.service.js";
import { errorWrapper, responseUtils, successMessage } from "../../../shared/middlewares/index.js";

export class ExampleController {
  static getList = errorWrapper(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const data = await ExampleService.getList(venueId);
    return responseUtils.success(res, {
      data,
      message: successMessage.fetched("Examples"),
      status: 200,
      meta: { count: data.length },
    });
  });

  static createItem = errorWrapper(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const data = await ExampleService.create(venueId, req.body);
    return responseUtils.created(res, {
      data,
      message: successMessage.created("Example"),
    });
  });
}
```

### Standard Response Envelope Format
All successful responses return the uniform JSON envelope:
```json
{
  "success": true,
  "message": "Resource created successfully",
  "data": { ... },
  "meta": { "count": 1 }
}
```

---

## 5. Input Validation Pattern (Zod)

### Defining Schemas (`*.validation.ts`)
```typescript
import { z } from "zod";

export const createDishSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.number().min(0, "Price must be non-negative"),
  categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Category ObjectId"),
  stationTag: z.enum(["MAIN_KITCHEN", "GRILL", "BAR", "DESSERT"]).default("MAIN_KITCHEN"),
  isAvailable: z.boolean().default(true),
});
```

### Attaching to Routes (`*.route.ts`)
```typescript
import { Router } from "express";
import { validateBody, authenticateJwt, requireRole } from "../../../shared/middlewares/index.js";
import { UserRole } from "@scan-and-dine/shared-types";
import { createDishSchema } from "./dish.validation.js";
import { DishController } from "./dish.controller.js";

const router = Router();

router.post(
  "/",
  authenticateJwt,
  requireRole(UserRole.VENUE_ADMIN, UserRole.MANAGER),
  validateBody(createDishSchema),
  DishController.createDish
);

export const dishRouter = router;
```

When validation fails, `errorHandler` automatically intercepts the `ZodError` and returns `400 Bad Request` with field-level details:
```json
{
  "success": false,
  "error": "Validation Error",
  "details": [
    { "path": "price", "message": "Price must be non-negative" }
  ]
}
```

---

## 6. Centralized Reusable Messages (`messages.constant.ts`)

### Reusable Builders (Pass Entity / Field First)
```typescript
import { errorMessage, successMessage } from "../../../shared/middlewares/index.js";

// Error Builders
errorMessage.notFound("Order")        // "Order not found"
errorMessage.notFound("Menu item")    // "Menu item not found"
errorMessage.alreadyExists("Table")   // "Table already exists"
errorMessage.isRequired("Venue ID")   // "Venue ID is required"
errorMessage.invalid("4-digit PIN")   // "Invalid 4-digit PIN provided"
errorMessage.alreadyVoided("Order")   // "This order has already been voided"

// Success Builders
successMessage.fetched("Floor map")   // "Floor map fetched successfully"
successMessage.created("Order")       // "Order created successfully"
successMessage.updated("KDS Item")    // "KDS Item updated successfully"
successMessage.deleted("Promo code")  // "Promo code deleted successfully"
```

---

## 7. API Error Generation Pattern (`generateAPIError` & `APIError`)

All services and controllers trigger operational errors using the `generateAPIError` helper function:

```typescript
import { generateAPIError, errorMessage } from "../../../shared/middlewares/index.js";

// Basic error with status code
return await generateAPIError(errorMessage.storeNotAvailable, 400);

// Dynamic not found error
return await generateAPIError(errorMessage.notFound("Order"), 404);

// Error with custom errorCode and data payload
return await generateAPIError(
  errorMessage.invalid("Modifier selection"),
  422,
  "INVALID_MODIFIER",
  { menuItemId, missingGroup: "Sauce" }
);
```

### Structure of `APIError`
```typescript
class APIError<T = unknown> extends Error {
  statusCode: number;
  success: boolean;
  errorCode?: string;
  data?: T;
}
```

When thrown:
1. `generateAPIError` logs diagnostics via `console.log(msg, statusCode, "error")`.
2. The error bubbles to the controller's `errorWrapper`.
3. Express forwards to `errorHandler`, which formats the standardized JSON response:
```json
{
  "success": false,
  "message": "Store is currently not available or closed",
  "error": "Store is currently not available or closed",
  "errorCode": "STORE_UNAVAILABLE",
  "data": { ... }
}
```

---

## 8. OpenAPI Documentation & Postman Auto-Sync Workflow

Whenever you introduce or modify API routes:
1. **Update `src/docs/openapi.json`**:
   Add endpoint tags, parameters, request body schemas, and response schemas matching OpenAPI 3.0.
2. **Re-generate Postman Collection**:
   Run the compilation script:
   ```bash
   npm run postman:gen
   ```
   This automatically injects test scripts, auth token propagation, and pre-request scripts into `postman_collection.json`.
3. **Verify Interactive Swagger UI**:
   Navigate to `http://localhost:3000/api/docs` to test endpoints interactively.

---

## 8. Common Mistakes to Avoid

- ❌ Writing `/api/v1` inside route definition files.
- ❌ Manually formatting JSON responses with `res.status(200).json({ ok: true, data })` instead of using `responseUtils.success`.
- ❌ Hardcoding plain strings like `"Order not found"` instead of `errorMessage.notFound("Order")`.
- ❌ Using single quotes (`'`) for string literals.
- ❌ Throwing raw JavaScript `Error` objects instead of `AppError`.
