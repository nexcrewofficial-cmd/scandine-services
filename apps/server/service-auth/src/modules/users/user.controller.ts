import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service.js';

export class UserController {
  static async listStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const staff = await UserService.getStaffByVenue(venueId);
      res.status(200).json({ success: true, count: staff.length, data: staff });
    } catch (err) {
      next(err);
    }
  }

  static async getStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const staff = await UserService.getStaffById(venueId, req.params.id as string);
      res.status(200).json({ success: true, data: staff });
    } catch (err) {
      next(err);
    }
  }

  static async createStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const staff = await UserService.createStaff(venueId, req.body);
      res.status(201).json({ success: true, message: 'Staff member onboarded', data: staff });
    } catch (err) {
      next(err);
    }
  }

  static async updateStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const staff = await UserService.updateStaff(venueId, req.params.id as string, req.body);
      res.status(200).json({ success: true, message: 'Staff member updated', data: staff });
    } catch (err) {
      next(err);
    }
  }

  static async deleteStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      await UserService.deactivateStaff(venueId, req.params.id as string);
      res.status(200).json({ success: true, message: 'Staff member deactivated' });
    } catch (err) {
      next(err);
    }
  }
}
