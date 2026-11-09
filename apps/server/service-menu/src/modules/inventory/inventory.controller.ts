import { Request, Response, NextFunction } from 'express';
import { InventoryService } from './inventory.service.js';

export class InventoryController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const items = await InventoryService.list(venueId);
      res.status(200).json({ success: true, count: items.length, data: items });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const item = await InventoryService.getById(venueId, req.params.id as string);
      res.status(200).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const item = await InventoryService.create(venueId, req.body);
      res.status(201).json({ success: true, message: 'Inventory item added', data: item });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const item = await InventoryService.update(venueId, req.params.id as string, req.body);
      res.status(200).json({ success: true, message: 'Inventory item updated', data: item });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      await InventoryService.delete(venueId, req.params.id as string);
      res.status(200).json({ success: true, message: 'Inventory item deleted' });
    } catch (err) {
      next(err);
    }
  }
}
