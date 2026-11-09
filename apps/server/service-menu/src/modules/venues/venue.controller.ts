import { Request, Response, NextFunction } from 'express';
import { VenueService } from './venue.service.js';

export class VenueController {
  static async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const venue = await VenueService.getVenueById(venueId);
      res.status(200).json({ success: true, data: venue });
    } catch (err) {
      next(err);
    }
  }

  static async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const venue = await VenueService.updateSettings(venueId, req.body);
      res.status(200).json({ success: true, message: 'Venue settings updated', data: venue });
    } catch (err) {
      next(err);
    }
  }

  static async getPublicVenue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venue = await VenueService.getVenueBySlug(req.params.venueSlug as string);
      res.status(200).json({ success: true, data: venue });
    } catch (err) {
      next(err);
    }
  }
}
