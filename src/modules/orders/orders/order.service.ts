import { FilterQuery } from "mongoose";
import { OrderModel, IOrderDocument } from "./order.model.js";
import { OrderUtils } from "./order.utils.js";
import { AppError, errorMessage } from "../../../shared/constants/messages.constant.js";
import {
  CreateOrderDTO,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  OrderType,
  OrderQueryFilters,
  PaginatedResult,
} from "@scan-and-dine/shared-types";
import { publishEvent, EventChannels } from "@scan-and-dine/event-bus";
import {
  parsePaginationQuery,
  escapeRegex,
  buildPaginationMeta,
} from "../../../shared/utils/query.util.js";

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
      status: dto.paymentMethod === PaymentMethod.CASH ? OrderStatus.SENT_TO_KITCHEN : OrderStatus.PENDING_PAYMENT,
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
      throw AppError.conflict(errorMessage.concurrencyConflict);
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
      throw AppError.notFound(errorMessage.notFound("Order"));
    }
    return order;
  }

  static async listOrdersByVenue(
    venueId: string,
    rawQuery: OrderQueryFilters = {}
  ): Promise<PaginatedResult<IOrderDocument>> {
    const { page, limit, skip, hasPaging, search, sort } = parsePaginationQuery(rawQuery, {
      createdAt: -1,
    });

    const query: FilterQuery<IOrderDocument> = { venueId, deletedAt: null };

    if (rawQuery.status && typeof rawQuery.status === "string") {
      query.status = rawQuery.status as OrderStatus;
    }

    if (rawQuery.paymentStatus && typeof rawQuery.paymentStatus === "string") {
      query.paymentStatus = rawQuery.paymentStatus as PaymentStatus;
    }

    if (rawQuery.paymentMethod && typeof rawQuery.paymentMethod === "string") {
      query.paymentMethod = rawQuery.paymentMethod as PaymentMethod;
    }

    if (rawQuery.orderType && typeof rawQuery.orderType === "string") {
      query.orderType = rawQuery.orderType as OrderType;
    }

    if (rawQuery.tableNumber && typeof rawQuery.tableNumber === "string") {
      query.tableNumber = rawQuery.tableNumber;
    }

    if (rawQuery.customerUUID && typeof rawQuery.customerUUID === "string") {
      query.customerUUID = rawQuery.customerUUID;
    }

    if (rawQuery.startDate || rawQuery.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (rawQuery.startDate) {
        const d = new Date(rawQuery.startDate as string);
        if (!isNaN(d.getTime())) dateFilter.$gte = d;
      }
      if (rawQuery.endDate) {
        const d = new Date(rawQuery.endDate as string);
        if (!isNaN(d.getTime())) dateFilter.$lte = d;
      }
      if (Object.keys(dateFilter).length > 0) {
        query.createdAt = dateFilter;
      }
    }

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      query.$or = [{ orderNumber: regex }, { tableNumber: regex }, { notes: regex }];
    }

    const total = await OrderModel.countDocuments(query);
    const mQuery = OrderModel.find(query).sort(sort);

    if (hasPaging) {
      mQuery.skip(skip).limit(limit);
    }

    const data = await mQuery;
    const meta = buildPaginationMeta(total, data.length, page, hasPaging ? limit : total || 1);

    return { data, meta };
  }

  static async getOrdersByCustomer(customerUUID: string): Promise<IOrderDocument[]> {
    return OrderModel.find({ customerUUID, deletedAt: null }).sort({ createdAt: -1 });
  }
}
