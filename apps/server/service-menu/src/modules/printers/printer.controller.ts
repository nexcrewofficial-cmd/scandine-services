import { Request, Response, NextFunction } from 'express';
import { PrinterService } from './printer.service.js';

export class PrinterController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const printers = await PrinterService.list(venueId);
      res.status(200).json({ success: true, count: printers.length, data: printers });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const printer = await PrinterService.create(venueId, req.body);
      res.status(201).json({ success: true, message: 'Printer registered', data: printer });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const printer = await PrinterService.update(venueId, req.params.id as string, req.body);
      res.status(200).json({ success: true, message: 'Printer updated', data: printer });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      await PrinterService.delete(venueId, req.params.id as string);
      res.status(200).json({ success: true, message: 'Printer deleted' });
    } catch (err) {
      next(err);
    }
  }
}
