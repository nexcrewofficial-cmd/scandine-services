---
name: scandine-auth-security
description: >-
  Authentication, authorization, RBAC roles, multi-tenant resolution, staff PIN verification,
  customer silent sessions, subscription tier gatekeeping, and GPS geofencing security in Scan & Dine.
---

# Authentication, Multi-Tenancy & Security Architecture

This skill governs all security protocols, authentication mechanisms, permission verifications, and multi-tenant isolation layers in the **Scan & Dine** backend.

---

## 1. Purpose and Scope

This skill instructs agents on:
- Protecting routes with JSON Web Token (JWT) verification.
- Enforcing Role-Based Access Control (RBAC) across management, staff, kitchen, and customer actors.
- Resolving and scoping multi-tenant requests (`venueId`).
- Authenticating POS and KDS staff using 4-digit PIN codes hashed with bcrypt.
- Securing guest customer sessions via silent device UUIDs.
- Enforcing GPS geofencing boundaries for dine-in digital orders.
- Gatekeeping endpoints based on venue SaaS subscription status.

---

## 2. Relevant Project Architecture & File Paths

- **Authentication Middlewares**: `src/shared/middlewares/`
  - `authenticateJwt`, `optionalJwt`: `src/shared/middlewares/auth.middleware.ts`
  - `requireRole`: `src/shared/middlewares/rbac.middleware.ts`
  - `requireVenueId`, `requireCustomerDevice`: `src/shared/middlewares/tenancy.middleware.ts`
  - `requireActiveSubscription`: `src/shared/middlewares/subscription.middleware.ts`
  - `requireGeofence`: `src/shared/middlewares/geofence.middleware.ts`
  - `AppError`: `src/shared/middlewares/app-error.ts`
- **User & Customer Models**:
  - `src/modules/auth/users/user.model.ts`
  - `src/modules/auth/customers/customer.model.ts`
- **Venue Model (Geofence & Feature Flags)**:
  - `src/modules/menu/venues/venue.model.ts`

---

## 3. Existing Coding Conventions

1. **Double Quotes (`"`) Mandatory**: All role names, error strings, token keys, and header names must use double quotes (`"`).
2. **Never Return Hash Secrets in Projections**:
   When querying `User`, never return `passwordHash` or `pinCodeHash` in API responses:
   ```typescript
   UserModel.find({ venueId }).select("-passwordHash -pinCodeHash -twoFactorSecret");
   ```
3. **Always Hash PINs**: Staff 4-digit PINs must always be hashed using `bcrypt.hash(pin, 10)` before persistence.
4. **Use Centralized Security Messages**: Always trigger operational errors using `return await generateAPIError(errorMessage.<key>, statusCode)` (`errorMessage.unauthorized`, `errorMessage.forbidden`, `errorMessage.invalidPin`, `errorMessage.sessionExpired`).
5. **Strict JWT & Payload Typing (Zero `any` Rule)**:
   - When generating or verifying JWTs, never cast options or payloads `as any`.
   - Sign tokens using typed `SignOptions`:
     ```typescript
     import jwt, { SignOptions } from "jsonwebtoken";
     import { JwtAuthPayload } from "./auth.interface.js";

     const signOptions: SignOptions = {
       expiresIn: config.jwtExpiresIn as SignOptions["expiresIn"],
     };
     const accessToken = jwt.sign(payload, config.jwtSecret, signOptions);
     ```
   - Verify and decode tokens by casting directly to `JwtAuthPayload` or `AuthenticatedUser`:
     ```typescript
     const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret) as JwtAuthPayload;
     ```
   - Always reuse existing domain interfaces (`JwtAuthPayload`, `AuthenticatedUser`, `UserRole`) across controllers and services instead of raw untyped `any`.

---

## 4. Middleware Pipeline Reference & Usage

### A. Protecting Admin & Staff Endpoints
```typescript
import { Router } from "express";
import {
  authenticateJwt,
  requireRole,
  requireVenueId,
  requireActiveSubscription,
  validateBody,
} from "../../../shared/middlewares/index.js";
import { UserRole } from "@scan-and-dine/shared-types";
import { createMenuItemSchema } from "./menu-item.validation.js";
import { MenuItemController } from "./menu-item.controller.js";

const router = Router();

router.post(
  "/",
  authenticateJwt,
  requireRole(UserRole.VENUE_ADMIN, UserRole.MANAGER),
  requireActiveSubscription,
  requireVenueId,
  validateBody(createMenuItemSchema),
  MenuItemController.createItem
);
```

### B. Protecting Public Dine-In Customer Endpoints
```typescript
import { Router } from "express";
import {
  requireVenueId,
  requireCustomerDevice,
  requireGeofence,
  validateBody,
} from "../../../shared/middlewares/index.js";
import { checkoutCashSchema } from "./checkout.validation.js";
import { CheckoutController } from "./checkout.controller.js";

const router = Router();

router.post(
  "/cash",
  requireVenueId,
  requireCustomerDevice,
  requireGeofence,
  validateBody(checkoutCashSchema),
  CheckoutController.checkoutWithCash
);
```

---

## 5. Security Workflows

### A. Staff 4-Digit PIN Authentication (POS / KDS Tablets)
Cooks and waitstaff log in on shared floor tablets using their venue ID and 4-digit PIN:
```typescript
const staffMembers = await UserModel.find({ venueId, isActive: true, deletedAt: null });
let matchedStaff = null;

for (const staff of staffMembers) {
  if (staff.pinCodeHash && (await bcrypt.compare(pinCode, staff.pinCodeHash))) {
    matchedStaff = staff;
    break;
  }
}

if (!matchedStaff) {
  return await generateAPIError(errorMessage.invalidPin, 401);
}
```

### B. Manager Authorization for High-Risk Actions (Voids & Refunds)
High-risk operations (such as voiding an order already sent to kitchen or clearing an unpaid table) require real-time Manager or Admin PIN authorization:
```typescript
const managers = await UserModel.find({
  venueId,
  role: { $in: [UserRole.MANAGER, UserRole.VENUE_ADMIN, UserRole.SUPER_ADMIN] },
  isActive: true,
  deletedAt: null,
});

let authorizedManager = null;
for (const mgr of managers) {
  if (mgr.pinCodeHash && (await bcrypt.compare(dto.managerPin, mgr.pinCodeHash))) {
    authorizedManager = mgr;
    break;
  }
}

if (!authorizedManager) {
  return await generateAPIError(errorMessage.invalidPin, 401);
}

order.status = OrderStatus.CANCELLED;
order.voidReason = dto.reason;
order.voidApprovedBy = authorizedManager._id;
await order.save();
```

### C. GPS Geofence Verification
To prevent fraudulent remote orders, `requireGeofence` verifies that the customer's coordinates fall within the venue's configured radius:
```typescript
const distance = calculateDistanceInMeters(
  customerLat,
  customerLng,
  venue.coordinates.coordinates[1],
  venue.coordinates.coordinates[0]
);

if (distance > venue.settings.geofenceRadiusMeters) {
  return await generateAPIError(errorMessage.outsideGeofence, 403);
}
```

---

## 6. Common Mistakes to Avoid

- ❌ Allowing client-supplied `venueId` in `req.body` to override the verified `req.user.venueId` extracted from JWT.
- ❌ Hardcoding plain text PIN codes in database seeds or queries.
- ❌ Trusting customer UUIDs without attaching `requireCustomerDevice`.
- ❌ Forgetting `requireActiveSubscription` on premium venue admin operations.
- ❌ Using single quotes (`'`) for role enums or permission checks.
