import { Request, Response, NextFunction } from 'express';
import { MenuItemService } from './menu-item.service.js';

export class MenuItemController {
  static async getPublicMenu(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const catalog = await MenuItemService.getPublicCatalog(req.params.venueSlug as string);
      res.status(200).json({ success: true, data: catalog });
    } catch (err) {
      next(err);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const items = await MenuItemService.listItems(venueId);
      res.status(200).json({ success: true, count: items.length, data: items });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const item = await MenuItemService.getItemById(venueId, req.params.id as string);
      res.status(200).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const item = await MenuItemService.createItem(venueId, req.body);
      res.status(201).json({ success: true, message: 'Item created', data: item });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const item = await MenuItemService.updateItem(venueId, req.params.id as string, req.body);
      res.status(200).json({ success: true, message: 'Item updated', data: item });
    } catch (err) {
      next(err);
    }
  }

  // 86-ing Toggle (Kitchen / Admin)
  static async toggleStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const item = await MenuItemService.toggleAvailability(
        venueId,
        req.params.id as string,
        req.body.isAvailable
      );
      res.status(200).json({
        success: true,
        message: item.isAvailable ? 'Item marked in-stock' : 'Item 86-ed (out of stock)',
        data: item,
      });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      await MenuItemService.deleteItem(venueId, req.params.id as string);
      res.status(200).json({ success: true, message: 'Item removed' });
    } catch (err) {
      next(err);
    }
  }
}
