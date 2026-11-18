import { Request, Response } from "express";
import { KDSService } from "./kds.service.js";
import { asyncHandler, responseUtils, successMessage } from "../../../shared/middlewares/index.js";

export class KDSController {
  static getTickets = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const stationTag = req.query.stationTag as string | undefined;
    const view = req.query.view as string | undefined;

    const data = await KDSService.getActiveTickets(venueId, stationTag, view);
    return responseUtils.success(res, {
      data,
      message: successMessage.dataFetched,
      status: 200,
    });
  });

  static updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const { status } = req.body;
    const data = await KDSService.advanceTicketStatus(venueId, req.params.id as string, status);
    return responseUtils.success(res, {
      data,
      message: successMessage.orderStatusUpdated,
      status: 200,
    });
  });

  static updateItemStatus = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const { id, itemIndex } = req.params;
    const { kdsStatus } = req.body;

    const data = await KDSService.updateItemStatus(
      venueId,
      id as string,
      Number(itemIndex),
      kdsStatus
    );

    return responseUtils.success(res, {
      data,
      message: successMessage.updated("Item status"),
      status: 200,
    });
  });

  static undoStatus = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const data = await KDSService.undoTicketStatus(venueId, req.params.id as string);
    return responseUtils.success(res, {
      data,
      message: "Ticket reverted back to preparing",
      status: 200,
    });
  });

  static printKOT = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const stationTag = req.body.stationTag || (req.query.stationTag as string | undefined);
    const data = await KDSService.printKOT(venueId, req.params.id as string, stationTag);

    return responseUtils.success(res, {
      data,
      message: "KOT printed successfully",
      status: 200,
    });
  });

  static getItemAvailability = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const data = await KDSService.getItemAvailability(venueId);
    return responseUtils.list(res, {
      key: "items",
      data,
    });
  });

  static toggleItemAvailability = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const { id } = req.params;
    const { isAvailable } = req.body;

    const data = await KDSService.toggleItemAvailability(venueId, id as string, isAvailable);
    return responseUtils.success(res, {
      data,
      message: data.isAvailable ? "Item marked in-stock" : "Item marked out of stock",
      status: 200,
    });
  });
}
