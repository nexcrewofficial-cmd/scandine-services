import {
  OrderType,
  OrderStatus,
  KdsItemStatus,
  PaymentStatus,
  PaymentMethod,
} from "./order.enum.js";
import { BaseEventPayload } from "../../../shared/event-bus/index.js";

export * from "./order.enum.js";

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
  orderNumber: string;
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
  serverStaffId?: string;
  voidReason?: string;
  voidApprovedBy?: string;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface CreateOrderDTO {
  venueId: string;
  tableNumber?: string;
  orderType: OrderType;
  customerUUID?: string;
  items: IOrderItem[];
  paymentMethod?: PaymentMethod;
  notes?: string;
}

export interface UpdateOrderStatusDTO {
  status: OrderStatus;
  kdsStationTag?: string;
}

export interface VoidOrderDTO {
  managerPin: string;
  reason: string;
}

export interface CallWaiterDTO {
  venueId: string;
  tableNumber: string;
  type?: "WATER" | "BILL" | "ASSISTANCE";
}

export interface OrderEventPayload extends BaseEventPayload {
  orderId: string;
  orderNumber: string;
  tableNumber?: string;
  status: string;
  data?: Record<string, unknown>;
}

export interface TableCallEventPayload extends BaseEventPayload {
  tableNumber: string;
  type: "WATER" | "BILL" | "ASSISTANCE";
}

