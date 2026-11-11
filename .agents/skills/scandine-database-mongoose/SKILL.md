---
name: scandine-database-mongoose
description: >-
  Mongoose schema design, multi-tenant database isolation, compound indexing, document lifecycle hooks,
  optimistic concurrency control, and query optimization patterns for Scan & Dine.
---

# Mongoose Database Architecture & Data Modeling Standards

This skill defines the canonical database modeling and persistence rules for **Mongoose (v8.x)** and **MongoDB** across the **Scan & Dine** backend platform.

---

## 1. Purpose and Scope

This skill instructs agents on:
- Designing Mongoose schemas that strictly adhere to tenant isolation rules.
- Typing Mongoose documents cleanly in TypeScript without property conflicts.
- Implementing compound indexing strategies for high-frequency queries during restaurant rush periods.
- Enforcing soft-delete mechanisms and optimistic concurrency control.
- Deciding between embedded subdocuments and relational references.

---

## 2. Relevant Project Architecture & File Paths

- **Models**:
  - `src/modules/auth/users/user.model.ts`
  - `src/modules/auth/customers/customer.model.ts`
  - `src/modules/auth/shifts/shift.model.ts`
  - `src/modules/menu/venues/venue.model.ts`
  - `src/modules/menu/categories/category.model.ts`
  - `src/modules/menu/menu-items/menu-item.model.ts`
  - `src/modules/menu/inventory/inventory.model.ts`
  - `src/modules/menu/promos/promo.model.ts`
  - `src/modules/menu/printers/printer.model.ts`
  - `src/modules/orders/orders/order.model.ts`
  - `src/modules/orders/cart/cart.model.ts`
  - `src/modules/orders/transactions/transaction.model.ts`
- **Database Connection**: `src/server.ts` (configured via `src/config/env.ts`)

---

## 3. Existing Coding Conventions

1. **Double Quotes (`"`) Mandatory**: All model names, collection options, and schema types must be enclosed in double quotes (`"`).
2. **Document Interface Typing Standard**:
   Always extend the domain interface using `Omit<IEntity, "_id">, Document`:
   ```typescript
   export interface IOrderDocument extends Omit<IOrder, "_id">, Document {}
   ```
   This prevents TypeScript conflicts between Mongoose's internal `_id` (`mongoose.Types.ObjectId`) and client string representations.
3. **Compound Indexes**: Every tenant-scoped collection must include compound indexes prefixed by `venueId: 1`.
4. **Soft Deletion**: Include `deletedAt: { type: Date, default: null }` on all entities that support deletion.

---

## 4. Standard Schema Template

```typescript
import mongoose, { Schema, Document } from "mongoose";
import { IExampleEntity } from "@scan-and-dine/shared-types";

export interface IExampleEntityDocument extends Omit<IExampleEntity, "_id">, Document {}

const ExampleEntitySchema = new Schema<IExampleEntityDocument>(
  {
    venueId: {
      type: Schema.Types.ObjectId as any,
      ref: "Venue",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "ARCHIVED"],
      default: "ACTIVE",
      index: true,
    },
    // Embedded subdocuments for tightly-coupled child items
    items: [
      {
        itemId: { type: Schema.Types.ObjectId as any, ref: "MenuItem", required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    // Optimistic Concurrency Control
    version: {
      type: Number,
      required: true,
      default: 0,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// High-speed compound indexes
ExampleEntitySchema.index({ venueId: 1, status: 1 });
ExampleEntitySchema.index({ venueId: 1, createdAt: -1 });

export const ExampleEntityModel = mongoose.model<IExampleEntityDocument>(
  "ExampleEntity",
  ExampleEntitySchema
);
```

---

## 5. Architectural Rules & Safety Principles

### A. Tenant Isolation is Mandatory
Every database query in business services must include `{ venueId }` in its filter query:
```typescript
// ✅ CORRECT: Multi-tenant safe
const order = await OrderModel.findOne({ _id: orderId, venueId, deletedAt: null });

// ❌ DANGEROUS: Tenant data leak vulnerability
const order = await OrderModel.findById(orderId);
```

### B. Embedded Subdocuments vs References
- **Embed Subdocuments** when:
  - Child data is always loaded and displayed with the parent (e.g. `order.items`, `menuItem.modifierGroups`, `cart.items`, `shift.breaks`).
  - Child data does not have an independent lifecycle.
- **Use References (`ObjectId`, `ref`)** when:
  - The entity exists independently and is queried across multiple collections (e.g. `MenuItem`, `Venue`, `User`, `Category`).

### C. Optimistic Concurrency Control (OCC)
In high-volume scenarios (such as concurrent table cart updates or status advances), use atomic find-and-modify with version incrementing to prevent lost updates:
```typescript
const updatedOrder = await OrderModel.findOneAndUpdate(
  { _id: orderId, venueId, version: currentVersion },
  {
    $set: { status: nextStatus },
    $inc: { version: 1 },
  },
  { new: true }
);

if (!updatedOrder) {
  throw AppError.conflict("Order was modified by another operation. Please reload and try again.");
}
```

### D. Financial Ledger Immutability
Never directly overwrite completed order totals or customer charge values. Every monetary movement must generate an immutable `Transaction` record:
```typescript
await TransactionModel.create({
  venueId: order.venueId,
  orderId: order._id,
  transactionType: TransactionType.CHARGE,
  amount: order.financials.grandTotal,
  breakdown: {
    venueRevenue: order.financials.subtotal,
    platformFee: order.financials.platformFee,
    taxCollected: order.financials.totalTax,
    tipCollected: order.financials.tipAmount,
  },
  status: TransactionStatus.SETTLED,
});
```

---

## 6. Common Mistakes to Avoid

- ❌ Querying records without `deletedAt: null` in read operations, causing soft-deleted items to reappear.
- ❌ Omitting `trim: true` or `lowercase: true` on unique string fields like emails, slugs, and SKUs.
- ❌ Using single quotes (`'`) for collection and model declarations.
- ❌ Using `.populate()` indiscriminately in high-frequency loops; instead use selective projection (`.populate("serverStaffId", "firstName lastName")`).
- ❌ Hard-deleting order records or financial transactions.

---

## 7. Testing & Database Verification

1. **Verify Index Creation**: Check index registration in MongoDB Compass or via `getIndexes()` in test suites.
2. **Verify Multi-Tenant Queries**: Confirm all queries filter by both `venueId` and `deletedAt: null`.
3. **Verify Schema Types**: Run `npm run build` to confirm all TypeScript interfaces match the schema definition.
