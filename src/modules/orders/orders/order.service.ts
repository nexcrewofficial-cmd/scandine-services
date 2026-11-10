import { OrderModel, IOrderDocument } from './order.model.js';
import { OrderUtils } from './order.utils.js';
import { AppError } from '@scan-and-dine/shared-middlewares';
import { CreateOrderDTO, OrderStatus, PaymentStatus } from '@scan-and-dine/shared-types';
import { publishEvent, EventChannels } from '@scan-and-dine/event-bus';

export class OrderService {
  static async createOrder(venueId: string, dto: CreateOrderDTO): Promise<IOrderDocument> {
    const financials = OrderUtils.calculateFinancials(dto.items);
    const orderNumber = OrderUtils.generateOrderNumber();

    const order = await OrderModel.create({
      venueId,
      customerUUID: dto.customerUUID,
      tableNumber: dto.tableNumber,
      orderType: dto.orderType,
      items: dto.items,
      financials,
      paymentStatus: PaymentStatus.UNPAID,
      paymentMethod: dto.paymentMethod,
      orderNumber,
      status: dto.paymentMethod === 'CASH' ? OrderStatus.SENT_TO_KITCHEN : OrderStatus.PENDING_PAYMENT,
      notes: dto.notes,
      version: 0,
    });

    if (order.status === OrderStatus.SENT_TO_KITCHEN) {
      await publishEvent(EventChannels.ORDER_CREATED, {
        venueId,
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        tableNumber: order.tableNumber,
        status: order.status,
      });
    }

    return order;
  }

  // Optimistic Concurrency Control for State Transitions
  static async updateStatus(
    venueId: string,
    orderId: string,
    nextStatus: OrderStatus,
    currentVersion: number
  ): Promise<IOrderDocument> {
    const order = await OrderModel.findOneAndUpdate(
      { _id: orderId, venueId, version: currentVersion },
      {
        $set: { status: nextStatus },
        $inc: { version: 1 },
      },
      { new: true }
    );

    if (!order) {
      throw AppError.conflict(
        'Concurrency conflict: Order was updated by another staff member. Please refresh.'
      );
    }

    // Emit event across Redis bus
    await publishEvent(EventChannels.ORDER_STATUS_CHANGED, {
      venueId,
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      status: order.status,
    });

    return order;
  }

  static async getOrderById(venueId: string, orderId: string): Promise<IOrderDocument> {
    const order = await OrderModel.findOne({ _id: orderId, venueId, deletedAt: null });
    if (!order) {
      throw AppError.notFound('Order not found');
    }
    return order;
  }

  static async listOrdersByVenue(venueId: string, status?: string): Promise<IOrderDocument[]> {
    const query: any = { venueId, deletedAt: null };
    if (status) query.status = status;
    return OrderModel.find(query).sort({ createdAt: -1 });
  }

  static async getOrdersByCustomer(customerUUID: string): Promise<IOrderDocument[]> {
    return OrderModel.find({ customerUUID, deletedAt: null }).sort({ createdAt: -1 });
  }
}
