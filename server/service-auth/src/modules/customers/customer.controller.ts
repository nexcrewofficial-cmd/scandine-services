import { Request, Response, NextFunction } from 'express';
import { CustomerService } from './customer.service.js';

export class CustomerController {
  static async registerDevice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await CustomerService.registerOrGetDevice(req.body);
      res.status(200).json({ success: true, data: customer });
    } catch (err) {
      next(err);
    }
  }

  static async getFavorites(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deviceUUID = req.headers['x-device-uuid'] as string;
      const favorites = await CustomerService.getFavorites(deviceUUID);
      res.status(200).json({ success: true, data: favorites });
    } catch (err) {
      next(err);
    }
  }
}
