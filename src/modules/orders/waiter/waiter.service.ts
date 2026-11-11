import bcrypt from 'bcryptjs';
import { OrderModel, IOrderDocument } from '../orders/order.model.js';
import { CartModel } from '../cart/cart.model.js';
import { TransactionModel } from '../transactions/transaction.model.js';
import { UserModel } from '../../auth/users/user.model.js';
import { MenuItemModel } from '../../menu/menu-items/menu-item.model.js';
import { VenueModel } from '../../menu/venues/venue.model.js';
import { AppError, errorMessage } from "../../../shared/middlewares/index.js";
import {
  OrderStatus,
  OrderType,
  PaymentStatus,
  PaymentMethod,
  KdsItemStatus,
  TransactionType,
  TransactionStatus,
  UserRole,
} from '@scan-and-dine/shared-types';
import { publishEvent, EventChannels } from '../../../shared/event-bus/index.js';
import {
  TableFloorMapItem,
  TableFloorStatus,
  ManualOrderDTO,
  VoidOrderDTO,
} from './waiter.interface.js';

export class WaiterService {
  /**
   * Live Floor Map: Aggregates active tables and calculates real-time color-coded statuses.
   * Empty (Grey), Browsing (Purple), Cooking (Yellow), Ready to Serve (Green), Unpaid (Red).
   */
  static async getLiveFloorMap(venueId: string): Promise<TableFloorMapItem[]> {
    // 1. Fetch active orders
    const activeOrders = await OrderModel.find({
      venueId,
      status: {
        $in: [
          OrderStatus.SENT_TO_KITCHEN,
          OrderStatus.PREPARING,
          OrderStatus.READY,
          OrderStatus.SERVED,
        ],
      },
      deletedAt: null,
    })
      .populate('serverStaffId', 'firstName lastName')
      .sort({ tableNumber: 1 });

    // 2. Fetch active carts that have items but no order placed yet
    const activeCarts = await CartModel.find({
      venueId,
      tableNumber: { $exists: true, $ne: '' },
      'items.0': { $exists: true },
    });

    const now = Date.now();
    const tableMap = new Map<string, TableFloorMapItem>();

    // Process active orders first
    for (const order of activeOrders) {
      if (!order.tableNumber) continue;

      let status: TableFloorStatus = 'COOKING';
      if (order.status === OrderStatus.READY) {
        status = 'READY_TO_SERVE'; // Green: kitchen finished cooking
      } else if (order.status === OrderStatus.SERVED && order.paymentStatus === PaymentStatus.UNPAID) {
        status = 'UNPAID'; // Red: customer finished meal, pay later cash pending
      } else if (order.status === OrderStatus.SERVED && order.paymentStatus === PaymentStatus.PAID) {
        status = 'EMPTY'; // Can be cleared
      }

      const placedMs = order.timing.placedAt ? new Date(order.timing.placedAt).getTime() : now;
      const seatedMinutes = Math.max(0, Math.floor((now - placedMs) / (1000 * 60)));

      const serverUser = order.serverStaffId as any;
      const serverStaffName = serverUser
        ? `${serverUser.firstName || ''} ${serverUser.lastName || ''}`.trim()
        : undefined;

      tableMap.set(order.tableNumber, {
        tableNumber: order.tableNumber,
        status,
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        seatedMinutes,
        itemCount: order.items.reduce((acc, i) => acc + i.quantity, 0),
        grandTotal: order.financials.grandTotal,
        paymentStatus: order.paymentStatus,
        serverStaffId: order.serverStaffId?.toString(),
        serverStaffName,
        placedAt: order.timing.placedAt?.toISOString(),
        lastActivityAt: order.updatedAt?.toISOString(),
      });
    }

    // Process browsing tables (active cart sessions with no order yet)
    for (const cart of activeCarts) {
      if (!cart.tableNumber || tableMap.has(cart.tableNumber)) continue;

      tableMap.set(cart.tableNumber, {
        tableNumber: cart.tableNumber,
        status: 'BROWSING', // Purple
        itemCount: cart.items.reduce((acc, i) => acc + i.quantity, 0),
        lastActivityAt: cart.updatedAt?.toISOString(),
      });
    }

    // Return tables sorted numerically or alphabetically
    return Array.from(tableMap.values()).sort((a, b) => {
      const numA = parseInt(a.tableNumber, 10);
      const numB = parseInt(b.tableNumber, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.tableNumber.localeCompare(b.tableNumber);
    });
  }

  /**
   * Fetch menu catalog for manual order entry by waitstaff.
   */
  static async getWaiterMenu(venueId: string) {
    return MenuItemModel.find({ venueId, isAvailable: true, deletedAt: null })
      .select('name price categoryId stationTag modifierGroups dietaryTags isAvailable')
      .sort({ categoryId: 1, name: 1 });
  }

  /**
   * Waiter Manual Order Punch (POS fallback / Table service).
   */
  static async punchManualOrder(
    venueId: string,
    waiterUserId: string,
    dto: ManualOrderDTO
  ): Promise<IOrderDocument> {
    const venue = await VenueModel.findById(venueId);
    if (!venue) {
      throw AppError.notFound('Venue not found');
    }

    const itemIds = dto.items.map((i) => i.menuItemId);
    const dbItems = await MenuItemModel.find({
      _id: { $in: itemIds },
      venueId,
      deletedAt: null,
    });

    const itemMap = new Map(dbItems.map((item) => [item._id.toString(), item]));

    let subtotal = 0;
    const orderItems: any[] = [];

    for (const inputItem of dto.items) {
      const menuItem = itemMap.get(inputItem.menuItemId);
      if (!menuItem) {
        throw AppError.badRequest(errorMessage.notFound("Menu item"));
      }

      let unitPrice = menuItem.price;
      const modifiersSelected = inputItem.modifiersSelected || [];

      modifiersSelected.forEach((mod) => {
        unitPrice += mod.extraPrice || 0;
      });

      const itemTotal = unitPrice * inputItem.quantity;
      subtotal += itemTotal;

      orderItems.push({
        menuItemId: menuItem._id,
        name: menuItem.name,
        quantity: inputItem.quantity,
        unitPrice,
        modifiersSelected,
        itemTotal,
        kdsStatus: KdsItemStatus.PENDING,
        stationTag: menuItem.stationTag || 'MAIN_KITCHEN',
        specialInstructions: inputItem.specialInstructions,
      });
    }

    const taxRate = venue.settings?.taxRate || 5;
    const totalTax = Math.round((subtotal * (taxRate / 100)) * 100) / 100;
    const grandTotal = Math.round((subtotal + totalTax) * 100) / 100;

    // Daily resetting order number
    const dailyCount = await OrderModel.countDocuments({
      venueId,
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    });
    const orderNumber = `W-${String(dailyCount + 1).padStart(3, '0')}`;

    const order = await OrderModel.create({
      venueId,
      orderNumber,
      tableNumber: dto.tableNumber,
      orderType: OrderType.DINE_IN,
      status: OrderStatus.SENT_TO_KITCHEN,
      items: orderItems,
      financials: {
        subtotal,
        totalTax,
        discountTotal: 0,
        tipAmount: 0,
        platformFee: 0,
        grandTotal,
      },
      paymentStatus: PaymentStatus.UNPAID,
      paymentMethod: PaymentMethod.CASH,
      serverStaffId: waiterUserId,
      timing: {
        placedAt: new Date(),
      },
      notes: dto.notes,
      version: 0,
    });

    // Clear any table cart session
    await CartModel.deleteOne({ venueId, tableNumber: dto.tableNumber });

    // Broadcast new order to Kitchen Display (KDS) & Floor Staff
    await publishEvent(EventChannels.ORDER_CREATED, {
      venueId,
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      status: order.status,
      timestamp: new Date().toISOString(),
    });

    return order;
  }

  /**
   * Mark food items as served / delivered to table.
   */
  static async markOrderServed(venueId: string, orderId: string): Promise<IOrderDocument> {
    const order = await OrderModel.findOne({ _id: orderId, venueId });
    if (!order) {
      throw AppError.notFound(errorMessage.notFound("Order"));
    }

    order.status = OrderStatus.SERVED;
    order.timing.servedAt = new Date();

    // If customer already paid online via card, complete the order
    if (order.paymentStatus === PaymentStatus.PAID) {
      order.status = OrderStatus.COMPLETED;
      order.timing.completedAt = new Date();
    }

    await order.save();

    await publishEvent(EventChannels.FOOD_SERVED, {
      venueId,
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      status: order.status,
      timestamp: new Date().toISOString(),
    });

    await publishEvent(EventChannels.TABLE_STATUS_CHANGED, {
      venueId,
      tableNumber: order.tableNumber,
      status: order.paymentStatus === PaymentStatus.UNPAID ? 'UNPAID' : 'EMPTY',
      timestamp: new Date().toISOString(),
    });

    return order;
  }

  /**
   * PIN-Protected Void Engine: Prevents employee theft by requiring Manager 4-digit PIN.
   */
  static async voidOrderWithManagerApproval(
    venueId: string,
    orderId: string,
    dto: VoidOrderDTO
  ): Promise<IOrderDocument> {
    // 1. Verify Manager or Admin PIN
    const managers = await UserModel.find({
      venueId,
      role: { $in: [UserRole.MANAGER, UserRole.VENUE_ADMIN, UserRole.SUPER_ADMIN] },
      isActive: true,
      deletedAt: null,
    });

    let approvedManager: any = null;
    for (const mgr of managers) {
      if (mgr.pinCodeHash) {
        const isMatch = await bcrypt.compare(dto.managerPin, mgr.pinCodeHash);
        if (isMatch) {
          approvedManager = mgr;
          break;
        }
      }
    }

    if (!approvedManager) {
      throw AppError.unauthorized(errorMessage.invalidPin);
    }

    // 2. Void the order
    const order = await OrderModel.findOne({ _id: orderId, venueId });
    if (!order) {
      throw AppError.notFound(errorMessage.notFound("Order"));
    }

    order.status = OrderStatus.CANCELLED;
    order.voidReason = dto.reason;
    order.voidApprovedBy = approvedManager._id;
    order.deletedAt = new Date();

    await order.save();

    // Broadcast void event to KDS and floor staff
    await publishEvent(EventChannels.ORDER_CANCELLED, {
      venueId,
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      reason: dto.reason,
      approvedBy: `${approvedManager.firstName} ${approvedManager.lastName}`,
      timestamp: new Date().toISOString(),
    });

    await publishEvent(EventChannels.TABLE_STATUS_CHANGED, {
      venueId,
      tableNumber: order.tableNumber,
      status: 'EMPTY',
      timestamp: new Date().toISOString(),
    });

    return order;
  }

  /**
   * Pay Later Queue: Lists tables awaiting cash collection at table.
   */
  static async getPayLaterQueue(venueId: string) {
    return OrderModel.find({
      venueId,
      status: { $in: [OrderStatus.SERVED, OrderStatus.READY] },
      paymentStatus: PaymentStatus.UNPAID,
      deletedAt: null,
    })
      .select('orderNumber tableNumber financials timing status serverStaffId')
      .sort({ 'timing.placedAt': 1 });
  }

  /**
   * Collect Cash Payment at Table: Settle transaction and complete table session.
   */
  static async collectCashPayment(
    venueId: string,
    orderId: string,
    amountReceived: number
  ): Promise<IOrderDocument> {
    const order = await OrderModel.findOne({ _id: orderId, venueId });
    if (!order) {
      throw AppError.notFound(errorMessage.notFound("Order"));
    }

    if (amountReceived < order.financials.grandTotal) {
      throw AppError.badRequest(
        `Amount received ($${amountReceived}) is less than total owed ($${order.financials.grandTotal})`
      );
    }

    order.paymentStatus = PaymentStatus.PAID;
    order.paymentMethod = PaymentMethod.CASH;
    order.status = OrderStatus.COMPLETED;
    order.timing.completedAt = new Date();

    await order.save();

    // Record ledger transaction
    await TransactionModel.create({
      venueId: order.venueId,
      orderId: order._id,
      transactionType: TransactionType.CHARGE,
      amount: order.financials.grandTotal,
      breakdown: {
        venueRevenue: order.financials.subtotal,
        platformFee: order.financials.platformFee,
        taxCollected: order.financials.totalTax,
        tipCollected: order.financials.tipAmount,
      },
      status: TransactionStatus.SETTLED,
    });

    // Notify floor map table is now free
    await publishEvent(EventChannels.TABLE_STATUS_CHANGED, {
      venueId,
      tableNumber: order.tableNumber,
      status: 'EMPTY',
      timestamp: new Date().toISOString(),
    });

    return order;
  }

  /**
   * Remote Bill Print Request: Waiter triggers receipt print on Admin Mini POS.
   */
  static async requestRemoteBillPrint(
    venueId: string,
    orderId: string,
    tableNumber: string
  ) {
    const order = await OrderModel.findOne({ _id: orderId, venueId });
    if (!order) {
      throw AppError.notFound(errorMessage.notFound("Order"));
    }

    const payload = {
      venueId,
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      tableNumber,
      grandTotal: order.financials.grandTotal,
      items: order.items.map((i) => ({ name: i.name, quantity: i.quantity, total: i.itemTotal })),
      timestamp: new Date().toISOString(),
    };

    // Emit event for Admin Mini POS print hub
    await publishEvent(EventChannels.BILL_PRINT_REQUESTED, payload);

    return payload;
  }
}
