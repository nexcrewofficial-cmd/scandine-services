import { CartModel, ICartDocument } from './cart.model.js';
import { AddToCartDTO } from '@scan-and-dine/shared-types';
import { publishEvent, EventChannels } from '@scan-and-dine/event-bus';

export class CartService {
  static async getCart(venueId: string, customerUUID: string): Promise<ICartDocument> {
    let cart = await CartModel.findOne({ venueId, customerUUID });
    if (!cart) {
      cart = await CartModel.create({
        venueId,
        customerUUID,
        items: [],
      });
    }
    return cart;
  }

  static async addItem(dto: AddToCartDTO): Promise<ICartDocument> {
    let cart = await CartModel.findOne({
      venueId: dto.venueId,
      customerUUID: dto.customerUUID,
    });

    if (!cart) {
      cart = new CartModel({
        venueId: dto.venueId,
        customerUUID: dto.customerUUID,
        tableNumber: dto.tableNumber,
        items: [],
      });
    }

    const modifierSum = dto.item.modifiersSelected.reduce((acc, m) => acc + m.extraPrice, 0);
    const itemTotal = (dto.item.unitPrice + modifierSum) * dto.item.quantity;

    // Check if duplicate item exists
    const existingIndex = cart.items.findIndex(
      (i) => i.menuItemId.toString() === dto.item.menuItemId
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += dto.item.quantity;
      cart.items[existingIndex].itemTotal += itemTotal;
    } else {
      cart.items.push({
        ...dto.item,
        itemTotal,
        kdsStatus: 'PENDING' as any,
      });
    }

    await cart.save();

    // Bi-directional live cart sync via Redis -> WebSockets
    if (cart.tableNumber) {
      await publishEvent(EventChannels.CART_SESSION_UPDATED, {
        venueId: dto.venueId,
        tableNumber: cart.tableNumber,
        customerUUID: dto.customerUUID,
        items: cart.items,
        timestamp: new Date().toISOString(),
      });
    }

    return cart;
  }

  static async clearCart(venueId: string, customerUUID: string): Promise<void> {
    await CartModel.deleteOne({ venueId, customerUUID });
  }
}
