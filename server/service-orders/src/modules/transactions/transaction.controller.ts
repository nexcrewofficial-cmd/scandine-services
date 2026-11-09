import { Request, Response, NextFunction } from 'express';
import { TransactionService } from './transaction.service.js';

export class TransactionController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const transactions = await TransactionService.list(venueId);
      res.status(200).json({ success: true, count: transactions.length, data: transactions });
    } catch (err) {
      next(err);
    }
  }

  static async refund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const refund = await TransactionService.refundTransaction(
        venueId,
        req.params.id as string,
        req.body.reason
      );
      res.status(200).json({ success: true, message: 'Refund processed', data: refund });
    } catch (err) {
      next(err);
    }
  }
}
