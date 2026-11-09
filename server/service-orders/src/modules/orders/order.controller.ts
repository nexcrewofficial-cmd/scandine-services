import { Request, Response, NextFunction } from 'express';
import { OrderService } from './order.service.js';
import { publishEvent, EventChannels } from '@scan-and-dine/event-bus';

export class OrderController {
  static async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const order = await OrderService.createOrder(venueId, req.body);
      res.status(201).json({ success: true, message: 'Order created', data: order });
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const { status, version } = req.body;
      const order = await OrderService.updateStatus(venueId, req.params.id as string, status, Number(version) || 0);
      res.status(200).json({ success: true, message: 'Order status updated', data: order });
    } catch (err) {
      next(err);
    }
  }

  static async getOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const order = await OrderService.getOrderById(venueId, req.params.id as string);
      res.status(200).json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }

  static async listOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const orders = await OrderService.listOrdersByVenue(venueId, req.query.status as string);
      res.status(200).json({ success: true, count: orders.length, data: orders });
    } catch (err) {
      next(err);
    }
  }

  static async callWaiter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.venueId!;
      const { tableNumber, type } = req.body;

      await publishEvent(EventChannels.TABLE_CALL_WAITER, {
        venueId,
        tableNumber,
        type: type || 'ASSISTANCE',
        timestamp: new Date().toISOString(),
      });

      res.status(200).json({ success: true, message: 'Waiter has been called to your table' });
    } catch (err) {
      next(err);
    }
  }
}
