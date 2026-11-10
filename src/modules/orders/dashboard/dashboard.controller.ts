import { Request, Response } from 'express';
import { DashboardService } from './dashboard.service.js';
import { asyncHandler, responseUtils, successMessage } from '../../../shared/middlewares/index.js';

export class DashboardController {
  static getOverview = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const data = await DashboardService.getOverview(venueId);
    return responseUtils.success(res, {
      data,
      message: successMessage.dataFetched,
      status: 200,
    });
  });
}

