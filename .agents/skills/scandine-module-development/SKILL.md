---
name: scandine-module-development
description: >-
  Standard operating procedure for creating and modifying feature modules in the Scan & Dine backend,
  enforcing self-contained feature folders, Single Responsibility Principle, and decoupled service layers.
---

# Feature Module Development Standards for Scan & Dine

This skill instructs agents on how to construct or modify domain modules and feature subfolders in the **Scan & Dine** backend platform.

---

## 1. Purpose and Scope

This skill governs the addition, modification, or refactoring of any business domain module (`src/modules/*`). It guarantees:
- Strict adherence to the **Self-Contained Feature Folder** architecture.
- Full compliance with the **Single Responsibility Principle (SRP)**.
- Prevention of circular dependency chains and module-level barrel file anti-patterns.
- Clear separation between the HTTP transport layer, business services, validation schemas, and database persistence.

---

## 2. Relevant Project Architecture & File Paths

All business domains are organized under `src/modules/`:
- `src/modules/auth/`: Staff users, customer accounts, and staff timeclock shifts.
- `src/modules/menu/`: Venues, categories, menu items, inventory, promos, and physical printers.
- `src/modules/orders/`: Orders, carts, checkout, KDS, waiter floor map, transactions, and webhooks.
- `src/modules/websockets/`: Real-time WebSocket server and Redis event-bus relay.

### Self-Contained Feature Directory Structure
Every feature must reside in its own folder under `src/modules/<domain>/<feature>/`:

```text
src/modules/<domain>/<feature>/
├── <feature>.enum.ts         # Domain enumerations (OrderStatus, StationTag, UserRole)
├── <feature>.interface.ts    # TypeScript interfaces, DTO contracts, event payloads
├── <feature>.model.ts        # Mongoose schema, compound indexes, and document interface
├── <feature>.validation.ts   # Zod validation schemas for incoming requests
├── <feature>.utils.ts        # Pure calculation or formatting helpers (zero side-effects)
├── <feature>.service.ts      # Domain business logic, database queries, event dispatch
├── <feature>.controller.ts   # HTTP handlers wrapped in errorWrapper with responseUtils
└── <feature>.route.ts        # Express router definitions and middleware attachment
```

---

## 3. Existing Coding Conventions

1. **Double Quotes (`"`) Mandatory**: All imports, strings, object keys, and route paths must be enclosed in double quotes (`"`). Single quotes (`'`) are prohibited.
2. **ESM Import Extensions**: All local file imports must explicitly end with `.js` (e.g., `import { UserModel } from "./user.model.js";`).
3. **No Redundant Barrel Files**: Never create `index.ts` files inside domain feature folders. Feature files must import directly from their siblings (e.g., `import { OrderModel } from "./order.model.js"`).
4. **Shared Types Mapping**: Feature enums and interfaces are exported via `src/shared/types/index.ts` for clean alias consumption (`@scan-and-dine/shared-types`).

---

## 4. Correct Implementation Workflow for a New Feature

When implementing a new feature in a module, follow this exact step-by-step sequence:

### Step 1: Define Enums & Interfaces
Create `<feature>.enum.ts` and `<feature>.interface.ts`:
```typescript
// src/modules/menu/tables/table.enum.ts
export enum TableStatus {
  EMPTY = "EMPTY",
  OCCUPIED = "OCCUPIED",
  RESERVED = "RESERVED",
}

// src/modules/menu/tables/table.interface.ts
export interface ITable {
  _id?: string;
  venueId: string;
  tableNumber: string;
  capacity: number;
  status: TableStatus;
  qrCodeUrl?: string;
  deletedAt?: Date | null;
}
```

### Step 2: Implement Mongoose Model
Create `<feature>.model.ts` with compound indexes and tenant isolation:
```typescript
// src/modules/menu/tables/table.model.ts
import mongoose, { Schema, Document } from "mongoose";
import { ITable, TableStatus } from "./table.interface.js";

export interface ITableDocument extends Omit<ITable, "_id">, Document {}

const TableSchema = new Schema<ITableDocument>(
  {
    venueId: { type: Schema.Types.ObjectId as any, ref: "Venue", required: true, index: true },
    tableNumber: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    status: { type: String, enum: Object.values(TableStatus), default: TableStatus.EMPTY },
    qrCodeUrl: { type: String },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

TableSchema.index({ venueId: 1, tableNumber: 1 }, { unique: true });

export const TableModel = mongoose.model<ITableDocument>("Table", TableSchema);
```

### Step 3: Define Zod Validation Schemas
Create `<feature>.validation.ts`:
```typescript
import { z } from "zod";

export const createTableSchema = z.object({
  tableNumber: z.string().min(1, "Table number is required"),
  capacity: z.number().int().min(1, "Capacity must be at least 1"),
});
```

### Step 4: Implement Domain Service
Create `<feature>.service.ts` with all business logic and event bus emission:
```typescript
import { TableModel, ITableDocument } from "./table.model.js";
import { AppError, errorMessage } from "../../../shared/middlewares/index.js";
import { publishEvent, EventChannels } from "../../../shared/event-bus/index.js";

export class TableService {
  static async createTable(venueId: string, data: any): Promise<ITableDocument> {
    const existing = await TableModel.findOne({ venueId, tableNumber: data.tableNumber, deletedAt: null });
    if (existing) {
      throw AppError.badRequest(errorMessage.alreadyExists("Table number"));
    }

    const table = await TableModel.create({ ...data, venueId });
    await publishEvent(EventChannels.TABLE_STATUS_CHANGED, {
      venueId,
      tableNumber: table.tableNumber,
      status: table.status,
      timestamp: new Date().toISOString(),
    });
    return table;
  }
}
```

### Step 5: Implement HTTP Controller
Create `<feature>.controller.ts` wrapped in `errorWrapper` with `responseUtils`:
```typescript
import { Request, Response } from "express";
import { TableService } from "./table.service.js";
import { errorWrapper, responseUtils, successMessage } from "../../../shared/middlewares/index.js";

export class TableController {
  static createTable = errorWrapper(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const data = await TableService.createTable(venueId, req.body);
    return responseUtils.success(res, {
      data,
      message: successMessage.created("Table"),
      status: 201,
    });
  });
}
```

### Step 6: Define Routes & Attach to Domain Master Router
Create `<feature>.route.ts` and mount in `src/modules/<domain>/routes.ts`:
```typescript
// src/modules/menu/tables/table.route.ts
import { Router } from "express";
import { TableController } from "./table.controller.js";
import { authenticateJwt, requireRole, requireVenueId, validateBody } from "../../../shared/middlewares/index.js";
import { UserRole } from "@scan-and-dine/shared-types";
import { createTableSchema } from "./table.validation.js";

const router = Router();
router.post(
  "/",
  authenticateJwt,
  requireRole(UserRole.VENUE_ADMIN, UserRole.MANAGER),
  requireVenueId,
  validateBody(createTableSchema),
  TableController.createTable
);
export const tableRouter = router;
```

---

## 5. Rules That Must Be Followed

1. **Controllers Never Query MongoDB Directly**: Controllers only unpack requests, invoke services, and serialize JSON responses.
2. **Never Call External Webhooks from Services Synchronously**: Always decouple notifications and thermal printing via `publishEvent(EventChannels.*)`.
3. **Always Scope by `venueId`**: Never execute queries without `{ venueId }` unless performing an authorized Super Admin global query.
4. **Use Centralized Message Constants**: Always use `errorMessage.notFound(...)`, `errorMessage.alreadyExists(...)`, and `successMessage.created(...)`.

---

## 6. Common Mistakes to Avoid

- ❌ Creating `index.ts` files inside feature subfolders that cause circular dependency deadlocks.
- ❌ Using single quotes (`'`) anywhere in TypeScript code.
- ❌ Hardcoding string error messages like `throw new Error("Table not found")`.
- ❌ Prefixing sub-routes with `/api/v1` in `*.route.ts` files.
- ❌ Forgetting the `.js` extension when importing local files in ESM mode.

---

## 7. Testing & Verification

1. **Verify TypeScript Compilation**: Run `npm run build` or `npx tsc --noEmit` to confirm zero type errors.
2. **Verify Route Mounting**: Check that the new router is mounted in `src/modules/<domain>/routes.ts`.
3. **Verify Documentation**: Update `src/docs/openapi.json` and run `npm run postman:gen` to ensure API documentation reflects the new feature.
