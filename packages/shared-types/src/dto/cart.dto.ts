import { ISelectedModifier } from '../interfaces/order.interface.js';

export interface CartItemDTO {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  modifiersSelected: ISelectedModifier[];
  specialInstructions?: string;
}

export interface AddToCartDTO {
  venueId: string;
  customerUUID: string;
  tableNumber?: string;
  item: CartItemDTO;
}

export interface ApplyPromoDTO {
  venueId: string;
  customerUUID: string;
  code: string;
}
