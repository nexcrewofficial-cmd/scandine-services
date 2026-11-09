import { Request, Response, NextFunction } from 'express';
import { PromoService } from './promo.service.js';

export class PromoController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const promos = await PromoService.list(venueId);
      res.status(200).json({ success: true, count: promos.length, data: promos });
    } catch (err) {
      next(err);
    }
  }

  static async validate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const { code, orderTotal } = req.body;
      const result = await PromoService.validateAndApply(venueId, code, Number(orderTotal) || 0);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const promo = await PromoService.create(venueId, req.body);
      res.status(201).json({ success: true, message: 'Promo code created', data: promo });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const promo = await PromoService.update(venueId, req.params.id as string, req.body);
      res.status(200).json({ success: true, message: 'Promo code updated', data: promo });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      await PromoService.delete(venueId, req.params.id as string);
      res.status(200).json({ success: true, message: 'Promo code deleted' });
    } catch (err) {
      next(err);
    }
  }
}
