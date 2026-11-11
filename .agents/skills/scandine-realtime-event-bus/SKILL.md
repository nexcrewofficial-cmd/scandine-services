---
name: scandine-realtime-event-bus
description: >-
  Real-time event-driven architecture, Redis Pub/Sub, local in-memory fallback, EventChannels catalog,
  and Socket.io room routing for KDS, Waiter App, and Table Cart sync in Scan & Dine.
---

# Real-Time Event Bus & WebSocket Architecture

This skill governs the event-driven pub/sub architecture and real-time Socket.io communication in the **Scan & Dine** backend platform.

---

## 1. Purpose and Scope

This skill instructs agents on:
- Decoupling domain side effects through the Redis Pub/Sub event bus.
- Using the `EventChannels` enum as the single source of truth for all platform events.
- Structuring multi-tenant event payloads using `BaseEventPayload`.
- Broadcasting real-time messages across isolated Socket.io rooms (Kitchen Screens, Waiter Tablets, Table Carts, Customer Trackers).
- Maintaining zero-crash development through the silent local in-memory fallback when Redis is offline.

---

## 2. Relevant Project Architecture & File Paths

- **Shared Event Bus**: `src/shared/event-bus/`
  - Channels Catalog: `src/shared/event-bus/channels.ts`
  - Base Payload Interface: `src/shared/event-bus/event.interface.ts`
  - Publisher: `src/shared/event-bus/publisher.ts`
  - Subscriber: `src/shared/event-bus/subscriber.ts`
  - Redis Client & Fallback: `src/shared/event-bus/redis-client.ts`
- **Domain Event Payloads**:
  - `OrderEventPayload`, `TableCallEventPayload`: `src/modules/orders/orders/order.interface.ts`
  - `ItemStockEventPayload`: `src/modules/menu/menu-items/menu-item.interface.ts`
- **WebSocket Server & Event Bridge**: `src/modules/websockets/socket-server.ts`

---

## 3. Existing Coding Conventions

1. **Double Quotes (`"`) Mandatory**: All channel enum values, socket room identifiers, and event names must be enclosed in double quotes (`"`).
2. **Never Use Raw String Channels**: Always use `EventChannels.<CHANNEL_NAME>`. Never pass plain strings like `"ORDER_CREATED"`.
3. **Multi-Tenancy Enforced on Every Event**: All event payloads must extend `BaseEventPayload` and include `venueId: string`.
4. **Domain Payload Placement Rule**:
   - `channels.ts` contains ONLY the `EventChannels` enum.
   - Domain-specific event payloads live directly in their domain interface files (`order.interface.ts`, `menu-item.interface.ts`), NOT in `channels.ts`.

---

## 4. Event Bus Flow & Room Routing Topology

```mermaid
flowchart TD
    Domain["Domain Service (e.g. OrderService, WaiterService)"]
    Domain -->|publishEvent(EventChannels.ORDER_CREATED, payload)| Bus["Redis Pub/Sub (Local Fallback)"]
    Bus -->|subscribeToEvent(EventChannels.ORDER_CREATED)| SocketBridge["WebSocket Server (socket-server.ts)"]
    
    SocketBridge -->|io.to('kds:venueId')| KDS["KDS Screens (Kitchen Line-Cooks)"]
    SocketBridge -->|io.to('waiter:venueId')| Waiter["Waiter App (Floor Staff Tablets)"]
    SocketBridge -->|io.to('order:orderId')| Customer["Customer Web App (Live Status Tracker)"]
    SocketBridge -->|io.to('table:venueId:tableNumber')| Table["Table Devices (Shared Live Cart)"]
```

### Socket.io Room Naming Conventions
- `venue:{venueId}`: Broadcast to all staff and displays in a restaurant.
- `kds:{venueId}`: Kitchen display screens and expo station tablets.
- `waiter:{venueId}`: Waiters and floor staff receiving service calls and ready food alerts.
- `table:{venueId}:{tableNumber}`: All customer devices sitting at the same table sharing a live cart.
- `order:{orderId}`: Real-time status updates for a specific order.

---

## 5. Implementation Workflow

### Step 1: Add Channel to `EventChannels` (if new)
Edit `src/shared/event-bus/channels.ts`:
```typescript
export enum EventChannels {
  // Existing channels...
  TABLE_RESERVED = "TABLE_RESERVED",
}
```

### Step 2: Define Payload Extending `BaseEventPayload`
In the domain's interface file (e.g., `table.interface.ts`):
```typescript
import { BaseEventPayload } from "../../../shared/event-bus/index.js";

export interface TableReservedEventPayload extends BaseEventPayload {
  tableNumber: string;
  reservationTime: string;
  guestName: string;
}
```

### Step 3: Publish from Domain Service
In the domain's service file (e.g., `table.service.ts`):
```typescript
import { publishEvent, EventChannels } from "../../../shared/event-bus/index.js";

await publishEvent<TableReservedEventPayload>(EventChannels.TABLE_RESERVED, {
  venueId,
  tableNumber: table.tableNumber,
  reservationTime: reservation.time,
  guestName: reservation.name,
  timestamp: new Date().toISOString(),
});
```

### Step 4: Bridge to WebSocket Rooms in `socket-server.ts`
In `src/modules/websockets/socket-server.ts`:
```typescript
subscribeToEvent<TableReservedEventPayload>(EventChannels.TABLE_RESERVED, (payload) => {
  io?.to(`waiter:${payload.venueId}`).emit("table_reserved", payload);
});
```

---

## 6. Common Mistakes to Avoid

- ❌ Defining payload interfaces inside `src/shared/event-bus/channels.ts` instead of feature domain files.
- ❌ Emitting events directly using raw strings instead of `EventChannels.<CHANNEL_NAME>`.
- ❌ Emitting sensitive customer payment details or passwords over WebSocket rooms.
- ❌ Forgetting `venueId` in event payloads, which breaks multi-tenant room isolation.
- ❌ Throwing errors if Redis is disconnected. The platform automatically uses the local in-memory fallback.
