export type TableFloorStatus =
  | 'EMPTY' // Grey: No active cart, no open orders
  | 'BROWSING' // Purple: Active cart session in progress
  | 'COOKING' // Yellow: Sent to kitchen / Preparing
  | 'READY_TO_SERVE' // Green: Food ready at counter for pickup
  | 'UNPAID'; // Red: Food served, Pay Later cash collection pending

export interface TableFloorMapItem {
  tableNumber: string;
  status: TableFloorStatus;
  orderId?: string;
  orderNumber?: string;
  seatedMinutes?: number;
  itemCount?: number;
  grandTotal?: number;
  paymentStatus?: string;
  serverStaffId?: string;
  serverStaffName?: string;
  placedAt?: string;
  lastActivityAt?: string;
}

export interface ManualOrderInputItem {
  menuItemId: string;
  quantity: number;
  specialInstructions?: string;
  modifiersSelected?: Array<{
    groupName: string;
    optionName: string;
    extraPrice: number;
  }>;
}

export interface ManualOrderDTO {
  tableNumber: string;
  items: ManualOrderInputItem[];
  notes?: string;
}

export interface VoidOrderDTO {
  managerPin: string;
  reason: string;
}

export interface CollectCashDTO {
  amountReceived: number;
}

export interface RemoteBillPrintDTO {
  orderId: string;
  tableNumber: string;
}
