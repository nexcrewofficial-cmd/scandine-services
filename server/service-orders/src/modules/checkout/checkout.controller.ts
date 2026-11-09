import { Request, Response, NextFunction } from 'express';
import { CheckoutService } from './checkout.service.js';

export class CheckoutController {
  static async initiateStripe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const customerUUID = req.customerUUID!;
      const idempotencyKey = req.headers['idempotency-key'] as string;

      const result = await CheckoutService.initiateStripeCheckout(
        venueId,
        customerUUID,
        req.body.tableNumber,
        idempotencyKey
      );

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async checkoutCash(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const customerUUID = req.customerUUID!;
      const { tableNumber } = req.body;

      const order = await CheckoutService.checkoutWithCash(venueId, customerUUID, tableNumber);
      res.status(201).json({ success: true, message: 'Order submitted to kitchen', data: order });
    } catch (err) {
      next(err);
    }
  }
}
