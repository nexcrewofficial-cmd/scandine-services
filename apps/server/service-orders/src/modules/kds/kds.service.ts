import { OrderModel, IOrderDocument } from '../orders/order.model.js';
import { AppError } from '@scan-and-dine/shared-middlewares';
import { OrderStatus, KdsItemStatus } from '@scan-and-dine/shared-types';
import { publishEvent, EventChannels } from '@scan-and-dine/event-bus';

export interface KDSTicketSummary {
  orderId: string;
  orderNumber: string;
  tableNumber?: string;
  status: OrderStatus;
  elapsedMinutes: number;
  slaColor: 'GREEN' | 'YELLOW' | 'FLASHING_RED';
  items: Array<{
    name: string;
    quantity: number;
    modifiers: string[];
    kdsStatus: KdsItemStatus;
    stationTag?: string;
    specialInstructions?: string;
  }>;
}

export class KDSService {
  // Returns tickets filtered by optional stationTag (e.g. GRILL, BAR, DESSERT)
  static async getActiveTickets(venueId: string, stationTag?: string): Promise<KDSTicketSummary[]> {
    const orders = await OrderModel.find({
      venueId,
      status: { $in: [OrderStatus.SENT_TO_KITCHEN, OrderStatus.PREPARING] },
      deletedAt: null,
    }).sort({ 'timing.placedAt': 1 });

    const now = Date.now();

    return orders.map((order) => {
      const placedMs = order.timing.placedAt ? new Date(order.timing.placedAt).getTime() : now;
      const elapsedMinutes = Math.floor((now - placedMs) / (1000 * 60));

      // Algorithmic SLA Timers: Green (0-10m), Yellow (10-15m), Flashing Red (15m+)
      let slaColor: 'GREEN' | 'YELLOW' | 'FLASHING_RED' = 'GREEN';
      if (elapsedMinutes >= 15) {
        slaColor = 'FLASHING_RED';
      } else if (elapsedMinutes >= 10) {
        slaColor = 'YELLOW';
      }

      // Filter items if specific station requested
      const filteredItems = stationTag
        ? order.items.filter((i) => !i.stationTag || i.stationTag === stationTag)
        : order.items;

      return {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        tableNumber: order.tableNumber,
        status: order.status,
        elapsedMinutes,
        slaColor,
        items: filteredItems.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          modifiers: i.modifiersSelected.map((m) => m.optionName),
          kdsStatus: i.kdsStatus,
          stationTag: i.stationTag,
          specialInstructions: i.specialInstructions,
        })),
      };
    });
  }

  static async advanceTicketStatus(
    venueId: string,
    orderId: string,
    nextStatus: OrderStatus
  ): Promise<IOrderDocument> {
    const order = await OrderModel.findOne({ _id: orderId, venueId });
    if (!order) {
      throw AppError.notFound('Order ticket not found');
    }

    order.status = nextStatus;
    if (nextStatus === OrderStatus.PREPARING) {
      order.timing.acceptedAt = new Date();
      await publishEvent(EventChannels.FOOD_PREPARING, {
        venueId,
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        tableNumber: order.tableNumber,
        status: order.status,
      });
    } else if (nextStatus === OrderStatus.READY) {
      order.timing.preparedAt = new Date();
      // Notify floor staff / waiter app
      await publishEvent(EventChannels.FOOD_READY, {
        venueId,
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        tableNumber: order.tableNumber,
        status: order.status,
      });
    }

    await order.save();
    return order;
  }
}
