import { Request, Response } from 'express';
import { KDSService } from './kds.service.js';
import { asyncHandler, responseUtils, successMessage } from '../../../shared/middlewares/index.js';

export class KDSController {
  static getTickets = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const stationTag = req.query.stationTag as string | undefined;
    const data = await KDSService.getActiveTickets(venueId, stationTag);
    return responseUtils.success(res, {
      data,
      message: successMessage.dataFetched,
      status: 200,
      meta: { count: data.length },
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
}

