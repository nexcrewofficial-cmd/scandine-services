import { Request, Response, NextFunction } from 'express';
import { CartService } from './cart.service.js';

export class CartController {
  static async getCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const customerUUID = req.customerUUID!;
      const cart = await CartService.getCart(venueId, customerUUID);
      res.status(200).json({ success: true, data: cart });
    } catch (err) {
      next(err);
    }
  }

  static async addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const customerUUID = req.customerUUID!;
      const cart = await CartService.addItem({
        venueId,
        customerUUID,
        tableNumber: req.body.tableNumber,
        item: req.body.item,
      });
      res.status(200).json({ success: true, message: 'Item added to cart', data: cart });
    } catch (err) {
      next(err);
    }
  }

  static async clearCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const customerUUID = req.customerUUID!;
      await CartService.clearCart(venueId, customerUUID);
      res.status(200).json({ success: true, message: 'Cart cleared' });
    } catch (err) {
      next(err);
    }
  }
}
