import { Request, Response, NextFunction } from 'express';
import { KDSService } from './kds.service.js';

export class KDSController {
  static async getTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const stationTag = req.query.stationTag as string | undefined;
      const tickets = await KDSService.getActiveTickets(venueId, stationTag);
      res.status(200).json({ success: true, count: tickets.length, data: tickets });
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const { status } = req.body;
      const order = await KDSService.advanceTicketStatus(venueId, req.params.id as string, status);
      res.status(200).json({ success: true, message: 'Ticket status updated', data: order });
    } catch (err) {
      next(err);
    }
  }
}
