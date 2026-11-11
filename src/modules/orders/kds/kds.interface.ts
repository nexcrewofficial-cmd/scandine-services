import { OrderStatus, KdsItemStatus } from '@scan-and-dine/shared-types';

export interface KDSTicketItem {
  index: number;
  name: string;
  quantity: number;
  modifiers: string[];
  kdsStatus: KdsItemStatus;
  stationTag?: string;
  specialInstructions?: string;
}

export interface KDSTicketSummary {
  orderId: string;
  orderNumber: string;
  tableNumber?: string;
  orderType: string;
  status: OrderStatus;
  elapsedMinutes: number;
  slaColor: 'GREEN' | 'YELLOW' | 'FLASHING_RED';
  placedAt?: string;
  acceptedAt?: string;
  items: KDSTicketItem[];
}

export interface KDSKanbanView {
  newTickets: KDSTicketSummary[];
  preparingTickets: KDSTicketSummary[];
  readyTickets: KDSTicketSummary[];
  totalActive: number;
}

export interface KOTPrintSlip {
  venueName: string;
  orderNumber: string;
  tableNumber: string;
  stationTag?: string;
  timestamp: string;
  items: Array<{
    quantity: number;
    name: string;
    modifiers: string[];
    specialInstructions?: string;
  }>;
  formattedText: string;
}
