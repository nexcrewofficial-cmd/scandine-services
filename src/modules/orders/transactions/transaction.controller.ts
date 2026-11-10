import { Request, Response } from 'express';
import { TransactionService } from './transaction.service.js';
import { asyncHandler, responseUtils, successMessage } from '../../../shared/middlewares/index.js';

export class TransactionController {
  static list = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const data = await TransactionService.list(venueId);
    return responseUtils.success(res, {
      data,
      message: successMessage.dataFetched,
      status: 200,
      meta: { count: data.length },
    });
  });

  static refund = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const data = await TransactionService.refundTransaction(
      venueId,
      req.params.id as string,
      req.body.reason
    );
    return responseUtils.success(res, {
      data,
      message: successMessage.refundProcessed,
      status: 200,
    });
  });
}

