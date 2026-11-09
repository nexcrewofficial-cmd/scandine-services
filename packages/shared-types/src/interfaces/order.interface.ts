import { OrderType, OrderStatus, KdsItemStatus } from '../enums/order.enum.js';
import { PaymentStatus, PaymentMethod } from '../enums/payment.enum.js';

export interface ISelectedModifier {
  groupName: string;
  optionName: string;
  extraPrice: number;
}

export interface IOrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  modifiersSelected: ISelectedModifier[];
  itemTotal: number;
  kdsStatus: KdsItemStatus;
  stationTag?: string;
  specialInstructions?: string;
}

export interface IOrderFinancials {
  subtotal: number;
  totalTax: number;
  discountTotal: number;
  tipAmount: number;
  platformFee: number;
  grandTotal: number;
}

export interface IOrderTiming {
  placedAt: Date;
  acceptedAt?: Date;
  preparedAt?: Date;
  servedAt?: Date;
  completedAt?: Date;
}

export interface IOrder {
  _id?: string;
  venueId: string;
  customerUUID?: string;
  orderNumber: string; // e.g. "A-104" or "#402"
  tableNumber?: string;
  orderType: OrderType;
  status: OrderStatus;
  items: IOrderItem[];
  financials: IOrderFinancials;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  stripeIdempotencyKey?: string;
  stripePaymentIntentId?: string;
  timing: IOrderTiming;
  notes?: string;
  version: number; // Concurrency protection (Optimistic Locking)
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}
