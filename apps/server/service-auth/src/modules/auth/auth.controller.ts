import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';

export class AuthController {
  static async adminLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.adminLogin(req.body);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async staffPinLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.staffPinLogin(req.body);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { accessToken } = await AuthService.refresh(req.body.refreshToken);
      res.status(200).json({ success: true, accessToken });
    } catch (err) {
      next(err);
    }
  }

  static async logout(_req: Request, res: Response): Promise<void> {
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  }
}
