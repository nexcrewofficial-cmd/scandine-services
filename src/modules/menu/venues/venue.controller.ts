import { Request, Response } from 'express';
import { VenueService } from './venue.service.js';
import { asyncHandler, responseUtils, successMessage } from '../../../shared/middlewares/index.js';

export class VenueController {
  static getSettings = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const data = await VenueService.getVenueById(venueId);
    return responseUtils.success(res, {
      data,
      message: successMessage.dataFetched,
      status: 200,
    });
  });

  static updateSettings = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const data = await VenueService.updateSettings(venueId, req.body);
    return responseUtils.success(res, {
      data,
      message: successMessage.updated,
      status: 200,
    });
  });

  static getPublicVenue = asyncHandler(async (req: Request, res: Response) => {
    const data = await VenueService.getVenueBySlug(req.params.venueSlug as string);
    return responseUtils.success(res, {
      data,
      message: successMessage.dataFetched,
      status: 200,
    });
  });
}

