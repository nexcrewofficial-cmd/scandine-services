import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service.js';

export class DashboardController {
  static async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const data = await DashboardService.getOverview(venueId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}
