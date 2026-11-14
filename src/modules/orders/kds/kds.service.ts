import { OrderModel, IOrderDocument } from '../orders/order.model.js';
import { VenueModel } from '../../menu/venues/venue.model.js';
import { MenuItemModel } from '../../menu/menu-items/menu-item.model.js';
import { AppError, errorMessage } from "../../../shared/middlewares/index.js";
import { OrderStatus, KdsItemStatus } from '../orders/order.enum.js';
import { publishEvent, EventChannels } from '../../../shared/event-bus/index.js';
import {
  KDSTicketSummary,
  KDSTicketItem,
  KDSKanbanView,
  KOTPrintSlip,
} from './kds.interface.js';

export class KDSService {
  /**
   * Fetches active kitchen tickets with algorithmic SLA timers.
   * Supports filtering by kitchen station (e.g. BAR, GRILL, DESSERT) and Kanban view format.
   */
  static async getActiveTickets(
    venueId: string,
    stationTag?: string,
    view?: string
  ): Promise<KDSTicketSummary[] | KDSKanbanView> {
    const orders = await OrderModel.find({
      venueId,
      status: {
        $in: [
          OrderStatus.SENT_TO_KITCHEN,
          OrderStatus.PREPARING,
          OrderStatus.READY,
        ],
      },
      deletedAt: null,
    }).sort({ 'timing.placedAt': 1 });

    const now = Date.now();

    const tickets: KDSTicketSummary[] = [];

    for (const order of orders) {
      const placedMs = order.timing.placedAt
        ? new Date(order.timing.placedAt).getTime()
        : now;
      const elapsedMinutes = Math.max(0, Math.floor((now - placedMs) / (1000 * 60)));

      // Algorithmic SLA Timers: Green (0-10m), Yellow (10-15m), Flashing Red (15m+)
      let slaColor: 'GREEN' | 'YELLOW' | 'FLASHING_RED' = 'GREEN';
      if (elapsedMinutes >= 15) {
        slaColor = 'FLASHING_RED';
      } else if (elapsedMinutes >= 10) {
        slaColor = 'YELLOW';
      }

      // Filter items if specific station requested (or return all for Expo screen)
      const mappedItems: KDSTicketItem[] = order.items
        .map((item, index) => ({
          index,
          name: item.name,
          quantity: item.quantity,
          modifiers: item.modifiersSelected.map((m) => m.optionName),
          kdsStatus: item.kdsStatus,
          stationTag: item.stationTag,
          specialInstructions: item.specialInstructions,
        }))
        .filter((item) => !stationTag || item.stationTag === stationTag);

      // If station filter active, only include tickets that have items for this station
      if (stationTag && mappedItems.length === 0) {
        continue;
      }

      tickets.push({
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        tableNumber: order.tableNumber,
        orderType: order.orderType,
        status: order.status,
        elapsedMinutes,
        slaColor,
        placedAt: order.timing.placedAt?.toISOString(),
        acceptedAt: order.timing.acceptedAt?.toISOString(),
        items: mappedItems,
      });
    }

    // Return Kanban structure if requested
    if (view === 'kanban') {
      const kanban: KDSKanbanView = {
        newTickets: tickets.filter((t) => t.status === OrderStatus.SENT_TO_KITCHEN),
        preparingTickets: tickets.filter((t) => t.status === OrderStatus.PREPARING),
        readyTickets: tickets.filter((t) => t.status === OrderStatus.READY),
        totalActive: tickets.length,
      };
      return kanban;
    }

    return tickets;
  }

  /**
   * Advance overall ticket status (e.g. SENT_TO_KITCHEN -> PREPARING -> READY)
   */
  static async advanceTicketStatus(
    venueId: string,
    orderId: string,
    nextStatus: OrderStatus
  ): Promise<IOrderDocument> {
    const order = await OrderModel.findOne({ _id: orderId, venueId });
    if (!order) {
      throw AppError.notFound(errorMessage.notFound("Order ticket"));
    }

    order.status = nextStatus;

    if (nextStatus === OrderStatus.PREPARING) {
      order.timing.acceptedAt = new Date();
      // Advance any pending items to COOKING
      order.items.forEach((item) => {
        if (item.kdsStatus === KdsItemStatus.PENDING) {
          item.kdsStatus = KdsItemStatus.COOKING;
        }
      });

      await publishEvent(EventChannels.FOOD_PREPARING, {
        venueId,
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        tableNumber: order.tableNumber,
        status: order.status,
        timestamp: new Date().toISOString(),
      });
    } else if (nextStatus === OrderStatus.READY) {
      order.timing.preparedAt = new Date();
      // Mark all items READY
      order.items.forEach((item) => {
        item.kdsStatus = KdsItemStatus.READY;
      });

      // Broadcast alert to floor staff (waiter app) and customer
      await publishEvent(EventChannels.FOOD_READY, {
        venueId,
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        tableNumber: order.tableNumber,
        status: order.status,
        timestamp: new Date().toISOString(),
      });
    }

    await order.save();
    return order;
  }

  /**
   * Item-Level Status Updates for Advanced Multi-Station Routing & Expo Screen.
   * If all items in the order reach READY, the order automatically transitions to READY.
   */
  static async updateItemStatus(
    venueId: string,
    orderId: string,
    itemIndex: number,
    kdsStatus: KdsItemStatus
  ): Promise<IOrderDocument> {
    const order = await OrderModel.findOne({ _id: orderId, venueId });
    if (!order) {
      throw AppError.notFound(errorMessage.notFound("Order ticket"));
    }

    if (!order.items[itemIndex]) {
      throw AppError.badRequest(errorMessage.itemIndexNotFound(itemIndex));
    }

    order.items[itemIndex].kdsStatus = kdsStatus;

    // If order was in SENT_TO_KITCHEN and cooking started, auto-advance order to PREPARING
    if (
      kdsStatus === KdsItemStatus.COOKING &&
      order.status === OrderStatus.SENT_TO_KITCHEN
    ) {
      order.status = OrderStatus.PREPARING;
      order.timing.acceptedAt = new Date();
    }

    // Check if ALL items across all stations are now READY
    const allItemsReady = order.items.every(
      (item) => item.kdsStatus === KdsItemStatus.READY
    );

    if (allItemsReady && order.status !== OrderStatus.READY) {
      order.status = OrderStatus.READY;
      order.timing.preparedAt = new Date();

      // Trigger automatic food ready notification to Waiter app
      await publishEvent(EventChannels.FOOD_READY, {
        venueId,
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        tableNumber: order.tableNumber,
        status: order.status,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Broadcast item-level change
      await publishEvent(EventChannels.KDS_ITEM_STATUS_CHANGED, {
        venueId,
        orderId: order._id.toString(),
        itemIndex,
        itemName: order.items[itemIndex].name,
        kdsStatus,
        allItemsReady,
        timestamp: new Date().toISOString(),
      });
    }

    await order.save();
    return order;
  }

  /**
   * Undo Safety Buffer: Reverts an accidental READY status back to PREPARING.
   */
  static async undoTicketStatus(
    venueId: string,
    orderId: string
  ): Promise<IOrderDocument> {
    const order = await OrderModel.findOne({ _id: orderId, venueId });
    if (!order) {
      throw AppError.notFound(errorMessage.notFound("Order ticket"));
    }

    if (order.status !== OrderStatus.READY) {
      throw AppError.badRequest(errorMessage.undoReadyTicketsOnly);
    }

    order.status = OrderStatus.PREPARING;
    order.timing.preparedAt = undefined;

    // Revert items back to COOKING
    order.items.forEach((item) => {
      item.kdsStatus = KdsItemStatus.COOKING;
    });

    await publishEvent(EventChannels.ORDER_STATUS_CHANGED, {
      venueId,
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      status: order.status,
      timestamp: new Date().toISOString(),
    });

    await order.save();
    return order;
  }

  /**
   * Thermal KOT (Kitchen Order Ticket) Printing Engine.
   * Generates formatted ESC/POS printable payload and dispatches KOT_PRINT_REQUESTED event.
   */
  static async printKOT(
    venueId: string,
    orderId: string,
    stationTag?: string
  ): Promise<KOTPrintSlip> {
    const order = await OrderModel.findOne({ _id: orderId, venueId });
    if (!order) {
      throw AppError.notFound(errorMessage.notFound("Order ticket"));
    }

    const venue = await VenueModel.findById(venueId);
    const venueName = venue?.name || 'Scan & Dine Kitchen';

    // Filter items if printing for a specific station printer
    const printableItems = stationTag
      ? order.items.filter((i) => !i.stationTag || i.stationTag === stationTag)
      : order.items;

    const timestamp = new Date().toLocaleString();
    const divider = '------------------------------------------\n';
    const doubleDivider = '==========================================\n';

    let formattedText = '';
    formattedText += doubleDivider;
    formattedText += `          ${venueName.toUpperCase()}\n`;
    formattedText += `          KITCHEN ORDER TICKET (KOT)\n`;
    formattedText += doubleDivider;
    formattedText += `ORDER : #${order.orderNumber}    TABLE: ${order.tableNumber || 'N/A'}\n`;
    formattedText += `TYPE  : ${order.orderType}    STATION: ${stationTag || 'ALL'}\n`;
    formattedText += `DATE  : ${timestamp}\n`;
    formattedText += divider;

    printableItems.forEach((item) => {
      formattedText += `[${item.quantity}x] ${item.name}\n`;
      if (item.modifiersSelected && item.modifiersSelected.length > 0) {
        item.modifiersSelected.forEach((m) => {
          formattedText += `     + ${m.optionName}\n`;
        });
      }
      if (item.specialInstructions) {
        formattedText += `     * NOTE: ${item.specialInstructions}\n`;
      }
    });

    formattedText += divider;
    formattedText += `Total Items: ${printableItems.reduce((acc, i) => acc + i.quantity, 0)}\n`;
    formattedText += doubleDivider;

    const slip: KOTPrintSlip = {
      venueName,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber || 'N/A',
      stationTag,
      timestamp,
      items: printableItems.map((i) => ({
        quantity: i.quantity,
        name: i.name,
        modifiers: i.modifiersSelected.map((m) => m.optionName),
        specialInstructions: i.specialInstructions,
      })),
      formattedText,
    };

    // Dispatch print event for local Print Agent or cloud thermal printer
    await publishEvent(EventChannels.KOT_PRINT_REQUESTED, {
      venueId,
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      stationTag: stationTag || 'ALL',
      slip,
      timestamp: new Date().toISOString(),
    });

    return slip;
  }

  /**
   * Kitchen Quick-Access: List menu items and their stock availability.
   */
  static async getItemAvailability(venueId: string) {
    return MenuItemModel.find({ venueId, deletedAt: null })
      .select('name price isAvailable stationTag categoryId media')
      .sort({ isAvailable: 1, name: 1 });
  }

  /**
   * Kitchen Quick-Access: Instantly toggle item in-stock / out-of-stock availability.
   */
  static async toggleItemAvailability(venueId: string, itemId: string, isAvailable: boolean) {
    const item = await MenuItemModel.findOne({ _id: itemId, venueId, deletedAt: null });
    if (!item) {
      throw AppError.notFound(errorMessage.notFound("Menu item"));
    }

    item.isAvailable = isAvailable;
    await item.save();

    const event = isAvailable ? EventChannels.ITEM_RESTOCKED : EventChannels.ITEM_OUT_OF_STOCK;
    await publishEvent(event, {
      venueId,
      menuItemId: item._id.toString(),
      isAvailable: item.isAvailable,
      timestamp: new Date().toISOString(),
    });

    return item;
  }
}
