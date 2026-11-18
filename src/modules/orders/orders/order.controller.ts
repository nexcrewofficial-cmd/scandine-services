import { Request, Response } from "express";
import { OrderService } from "./order.service.js";
import { publishEvent, EventChannels } from "@scan-and-dine/event-bus";
import { asyncHandler, responseUtils, successMessage } from "../../../shared/middlewares/index.js";

export class OrderController {
  static createOrder = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const data = await OrderService.createOrder(venueId, req.body);
    return responseUtils.success(res, {
      data,
      message: successMessage.orderCreated,
      status: 201,
    });
  });

  static updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const { status, version } = req.body;
    const data = await OrderService.updateStatus(venueId, req.params.id as string, status, Number(version) || 0);
    return responseUtils.success(res, {
      data,
      message: successMessage.orderStatusUpdated,
      status: 200,
    });
  });

  static getOrder = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const data = await OrderService.getOrderById(venueId, req.params.id as string);
    return responseUtils.success(res, {
      data,
      message: successMessage.dataFetched,
      status: 200,
    });
  });

  static listOrders = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const { data, meta } = await OrderService.listOrdersByVenue(venueId, req.query);
    return responseUtils.list(res, {
      key: "orders",
      data,
      meta,
    });
  });

  static callWaiter = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const { tableNumber, type } = req.body;

    await publishEvent(EventChannels.TABLE_CALL_WAITER, {
      venueId,
      tableNumber,
      type: type || 'ASSISTANCE',
      timestamp: new Date().toISOString(),
    });

    return responseUtils.success(res, {
      message: successMessage.waiterCalled,
      status: 200,
    });
  });
}

