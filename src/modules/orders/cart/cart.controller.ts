import { Request, Response } from 'express';
import { CartService } from './cart.service.js';
import { asyncHandler, responseUtils, successMessage } from '../../../shared/middlewares/index.js';

export class CartController {
  static getCart = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const customerUUID = req.customerUUID!;
    const data = await CartService.getCart(venueId, customerUUID);
    return responseUtils.success(res, {
      data,
      message: successMessage.dataFetched,
      status: 200,
    });
  });

  static addItem = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const customerUUID = req.customerUUID!;
    const data = await CartService.addItem({
      venueId,
      customerUUID,
      tableNumber: req.body.tableNumber,
      item: req.body.item,
    });
    return responseUtils.success(res, {
      data,
      message: successMessage.itemAddedToCart,
      status: 200,
    });
  });

  static clearCart = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const customerUUID = req.customerUUID!;
    await CartService.clearCart(venueId, customerUUID);
    return responseUtils.success(res, {
      message: successMessage.cartCleared,
      status: 200,
    });
  });
}

