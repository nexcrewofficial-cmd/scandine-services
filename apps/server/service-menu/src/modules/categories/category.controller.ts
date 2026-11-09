import { Request, Response, NextFunction } from 'express';
import { CategoryService } from './category.service.js';

export class CategoryController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const categories = await CategoryService.listCategories(venueId);
      res.status(200).json({ success: true, count: categories.length, data: categories });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const category = await CategoryService.createCategory(venueId, req.body);
      res.status(201).json({ success: true, message: 'Category created', data: category });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const category = await CategoryService.updateCategory(venueId, req.params.id as string, req.body);
      res.status(200).json({ success: true, message: 'Category updated', data: category });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      await CategoryService.deleteCategory(venueId, req.params.id as string);
      res.status(200).json({ success: true, message: 'Category removed' });
    } catch (err) {
      next(err);
    }
  }
}
