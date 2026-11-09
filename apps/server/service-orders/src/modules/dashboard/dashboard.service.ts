import mongoose from 'mongoose';
import { OrderModel } from '../orders/order.model.js';
import { OrderStatus, PaymentStatus } from '@scan-and-dine/shared-types';

export class DashboardService {
  static async getOverview(venueId: string) {
    const objectIdVenue = new mongoose.Types.ObjectId(venueId);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [todayStats] = await OrderModel.aggregate([
      {
        $match: {
          venueId: objectIdVenue,
          createdAt: { $gte: startOfToday },
          paymentStatus: { $in: [PaymentStatus.PAID, PaymentStatus.UNPAID] },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$financials.grandTotal' },
          totalOrders: { $sum: 1 },
          averageTicket: { $avg: '$financials.grandTotal' },
        },
      },
    ]);

    // Active tables count
    const activeTables = await OrderModel.distinct('tableNumber', {
      venueId: objectIdVenue,
      status: {
        $in: [
          OrderStatus.SENT_TO_KITCHEN,
          OrderStatus.PREPARING,
          OrderStatus.READY,
          OrderStatus.SERVED,
        ],
      },
    });

    // Recent orders feed
    const recentOrders = await OrderModel.find({ venueId: objectIdVenue })
      .sort({ createdAt: -1 })
      .limit(10);

    return {
      metrics: {
        todayRevenue: todayStats ? Math.round(todayStats.totalRevenue * 100) / 100 : 0,
        todayOrders: todayStats ? todayStats.totalOrders : 0,
        averageTicket: todayStats ? Math.round(todayStats.averageTicket * 100) / 100 : 0,
        activeTablesCount: activeTables.filter(Boolean).length,
      },
      activeTables: activeTables.filter(Boolean),
      recentOrders,
    };
  }
}
