import { Request, Response, NextFunction } from 'express';
import { ShiftService } from './shift.service.js';

export class ShiftController {
  static async clockIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const userId = req.user!.userId;
      const shift = await ShiftService.clockIn(venueId, userId);
      res.status(200).json({ success: true, message: 'Clocked in successfully', data: shift });
    } catch (err) {
      next(err);
    }
  }

  static async clockOut(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const userId = req.user!.userId;
      const shift = await ShiftService.clockOut(venueId, userId);
      res.status(200).json({ success: true, message: 'Clocked out successfully', data: shift });
    } catch (err) {
      next(err);
    }
  }

  static async listShifts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const shifts = await ShiftService.listShifts(venueId);
      res.status(200).json({ success: true, count: shifts.length, data: shifts });
    } catch (err) {
      next(err);
    }
  }
}
