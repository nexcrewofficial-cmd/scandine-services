import { Request, Response } from 'express';
import { CheckoutService } from './checkout.service.js';
import { asyncHandler, responseUtils, successMessage } from '../../../shared/middlewares/index.js';

export class CheckoutController {
  static initiateStripe = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const customerUUID = req.customerUUID!;
    const idempotencyKey = req.headers['idempotency-key'] as string;

    const data = await CheckoutService.initiateStripeCheckout(
      venueId,
      customerUUID,
      req.body.tableNumber,
      idempotencyKey
    );

    return responseUtils.success(res, {
      data,
      message: successMessage.operationSuccess,
      status: 200,
    });
  });

  static checkoutCash = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const customerUUID = req.customerUUID!;
    const { tableNumber } = req.body;

    const data = await CheckoutService.checkoutWithCash(venueId, customerUUID, tableNumber);
    return responseUtils.success(res, {
      data,
      message: successMessage.orderCreated,
      status: 201,
    });
  });
}

