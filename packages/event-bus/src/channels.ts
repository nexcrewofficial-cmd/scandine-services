export enum EventChannels {
  // Order Lifecycle
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_UPDATED = 'ORDER_UPDATED',
  ORDER_STATUS_CHANGED = 'ORDER_STATUS_CHANGED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',

  // KDS & Kitchen
  FOOD_PREPARING = 'FOOD_PREPARING',
  FOOD_READY = 'FOOD_READY',
  FOOD_SERVED = 'FOOD_SERVED',

  // Waiter & Floor
  TABLE_CALL_WAITER = 'TABLE_CALL_WAITER',
  TABLE_STATUS_CHANGED = 'TABLE_STATUS_CHANGED',
  BILL_PRINT_REQUESTED = 'BILL_PRINT_REQUESTED',

  // Inventory
  ITEM_86ED = 'ITEM_86ED',
  ITEM_RESTOCKED = 'ITEM_RESTOCKED',

  // Cart Sync
  CART_SESSION_UPDATED = 'CART_SESSION_UPDATED',
}

export interface BaseEventPayload {
  venueId: string;
  timestamp: string;
}

export interface OrderEventPayload extends BaseEventPayload {
  orderId: string;
  orderNumber: string;
  tableNumber?: string;
  status: string;
  data?: Record<string, unknown>;
}

export interface ItemStockEventPayload extends BaseEventPayload {
  menuItemId: string;
  isAvailable: boolean;
}

export interface TableCallEventPayload extends BaseEventPayload {
  tableNumber: string;
  type: 'WATER' | 'BILL' | 'ASSISTANCE';
}
