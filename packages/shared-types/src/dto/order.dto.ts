import { OrderType, OrderStatus } from '../enums/order.enum.js';
import { PaymentMethod } from '../enums/payment.enum.js';
import { IOrderItem } from '../interfaces/order.interface.js';

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
  type?: 'WATER' | 'BILL' | 'ASSISTANCE';
}
