import { Request, Response } from 'express';
import { WaiterService } from './waiter.service.js';
import { asyncHandler, responseUtils, successMessage } from '../../../shared/middlewares/index.js';

export class WaiterController {
  static getFloorMap = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const data = await WaiterService.getLiveFloorMap(venueId);
    return responseUtils.success(res, {
      data,
      message: successMessage.dataFetched,
      status: 200,
      meta: { count: data.length },
    });
  });

  static getMenu = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const data = await WaiterService.getWaiterMenu(venueId);
    return responseUtils.success(res, {
      data,
      message: successMessage.dataFetched,
      status: 200,
      meta: { count: data.length },
    });
  });

  static punchOrder = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const waiterUserId = req.user!.userId;
    const data = await WaiterService.punchManualOrder(venueId, waiterUserId, req.body);
    return responseUtils.success(res, {
      data,
      message: successMessage.orderCreated,
      status: 201,
    });
  });

  static serveOrder = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const data = await WaiterService.markOrderServed(venueId, req.params.id as string);
    return responseUtils.success(res, {
      data,
      message: 'Order marked as served',
      status: 200,
    });
  });

  static voidOrder = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const data = await WaiterService.voidOrderWithManagerApproval(
      venueId,
      req.params.id as string,
      req.body
    );
    return responseUtils.success(res, {
      data,
      message: 'Order voided successfully with manager authorization',
      status: 200,
    });
  });

  static getPayLaterQueue = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const data = await WaiterService.getPayLaterQueue(venueId);
    return responseUtils.success(res, {
      data,
      message: successMessage.dataFetched,
      status: 200,
      meta: { count: data.length },
    });
  });

  static collectCash = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const { amountReceived } = req.body;
    const data = await WaiterService.collectCashPayment(
      venueId,
      req.params.id as string,
      Number(amountReceived)
    );
    return responseUtils.success(res, {
      data,
      message: 'Cash payment collected and order settled',
      status: 200,
    });
  });

  static printBill = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const { tableNumber } = req.body;
    const data = await WaiterService.requestRemoteBillPrint(
      venueId,
      req.params.id as string,
      tableNumber || ''
    );
    return responseUtils.success(res, {
      data,
      message: 'Bill print request sent to POS hub',
      status: 200,
    });
  });
}
