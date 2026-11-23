import http from "http";
import { Server, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { Redis } from "ioredis";
import { logger } from "../../shared/logger/index.js";
import { subscribeToEvent, EventChannels } from "../../shared/event-bus/index.js";
import { config } from "../../config/env.js";
import { OrderEventPayload, TableCallEventPayload } from "../orders/orders/order.interface.js";
import { ItemStockEventPayload } from "../menu/menu-items/menu-item.interface.js";

let io: Server | null = null;

export const initWebSockets = (server: http.Server): Server => {
  if (io) return io;

  io = new Server(server, {
    cors: {
      origin: config.corsOrigin,
      methods: ["GET", "POST"],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Setup Redis Adapter for multi-instance scaling if Redis is configured and available
  try {
    const pubClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });
    const subClient = pubClient.duplicate();
    pubClient.on('error', () => {});
    subClient.on('error', () => {});

    pubClient.connect().then(() => {
      subClient.connect().then(() => {
        if (io) {
          io.adapter(createAdapter(pubClient, subClient));
          console.log("Connected to Redis 🚀");
        }
      });
    }).catch(() => {});
  } catch (err) {}

  // Client Connection Handling & Room Joining
  io.on('connection', (socket: Socket) => {
    logger.debug({ socketId: socket.id }, 'Client connected to WebSocket server');

    // Join Venue Room (Admin, Staff, or Customer)
    socket.on('join_venue', (venueId: string) => {
      socket.join(`venue:${venueId}`);
      logger.debug({ socketId: socket.id, venueId }, 'Joined venue room');
    });

    // Join KDS Kitchen Room (Master or Station-specific)
    socket.on('join_kds', (data: any) => {
      const venueId = typeof data === 'string' ? data : data?.venueId;
      const stationTag = typeof data === 'object' ? data?.stationTag : undefined;

      if (venueId) {
        socket.join(`kds:${venueId}`);
        if (stationTag) {
          socket.join(`kds:${venueId}:${stationTag}`);
          logger.debug({ socketId: socket.id, venueId, stationTag }, 'Joined station KDS room');
        } else {
          logger.debug({ socketId: socket.id, venueId }, 'Joined master KDS room');
        }
      }
    });

    // Join Waiter Floor Room
    socket.on('join_waiter', (venueId: string) => {
      socket.join(`waiter:${venueId}`);
      logger.debug({ socketId: socket.id, venueId }, 'Joined Waiter room');
    });

    // Join Table Session (Bi-directional Cart Mirroring)
    socket.on('join_table', ({ venueId, tableNumber }: { venueId: string; tableNumber: string }) => {
      socket.join(`table:${venueId}:${tableNumber}`);
      logger.debug({ socketId: socket.id, tableNumber }, 'Joined Table room');
    });

    // Customer tracking individual order
    socket.on('join_order', (orderId: string) => {
      socket.join(`order:${orderId}`);
      logger.debug({ socketId: socket.id, orderId }, 'Joined Order room');
    });

    socket.on('disconnect', () => {
      logger.debug({ socketId: socket.id }, 'Client disconnected');
    });
  });

  // =========================================================================
  // Subscribe to Event Bus and relay messages to appropriate socket rooms
  // =========================================================================

  // 1. New Order Received -> Notify KDS & Waiter
  subscribeToEvent<OrderEventPayload>(EventChannels.ORDER_CREATED, (payload) => {
    io?.to(`kds:${payload.venueId}`).emit('new_order_received', payload);
    io?.to(`waiter:${payload.venueId}`).emit('new_order_received', payload);
  });

  // 2. Order Status Changed -> Notify Customer, KDS, and Waiter
  subscribeToEvent<OrderEventPayload>(EventChannels.ORDER_STATUS_CHANGED, (payload) => {
    io?.to(`order:${payload.orderId}`).emit('order_status_update', payload);
    io?.to(`venue:${payload.venueId}`).emit('order_status_update', payload);
  });

  // 3. Food Ready at Counter -> Notify Waiter App
  subscribeToEvent<OrderEventPayload>(EventChannels.FOOD_READY, (payload) => {
    io?.to(`waiter:${payload.venueId}`).emit('food_ready_at_counter', payload);
    io?.to(`order:${payload.orderId}`).emit('order_status_update', {
      ...payload,
      status: 'READY',
    });
  });

  // 4. Call Waiter -> Alert Waiter App
  subscribeToEvent<TableCallEventPayload>(EventChannels.TABLE_CALL_WAITER, (payload) => {
    io?.to(`waiter:${payload.venueId}`).emit('table_needs_service', payload);
  });

  // 5. KDS Item Status Changed -> Update Station & Expo Screens
  subscribeToEvent(EventChannels.KDS_ITEM_STATUS_CHANGED, (payload: any) => {
    io?.to(`kds:${payload.venueId}`).emit('kds_item_updated', payload);
  });

  // 6. Thermal KOT Print Requested -> Send to Local Print Agent
  subscribeToEvent(EventChannels.KOT_PRINT_REQUESTED, (payload: any) => {
    io?.to(`kds:${payload.venueId}`).emit('kot_print_job', payload);
    io?.to(`venue:${payload.venueId}`).emit('kot_print_job', payload);
  });

  // 7. Item Out of Stock / Restocked -> Update Customer Menus
  subscribeToEvent<ItemStockEventPayload>(EventChannels.ITEM_OUT_OF_STOCK, (payload) => {
    io?.to(`venue:${payload.venueId}`).emit('item_stock_updated', payload);
    io?.to(`kds:${payload.venueId}`).emit('item_stock_updated', payload);
  });

  subscribeToEvent<ItemStockEventPayload>(EventChannels.ITEM_RESTOCKED, (payload) => {
    io?.to(`venue:${payload.venueId}`).emit('item_stock_updated', payload);
    io?.to(`kds:${payload.venueId}`).emit('item_stock_updated', payload);
  });

  // 8. Live Shared Cart Update -> Mirror across devices at that table
  subscribeToEvent(EventChannels.CART_SESSION_UPDATED, (payload: any) => {
    io?.to(`table:${payload.venueId}:${payload.tableNumber}`).emit('cart_updated', payload);
  });

  // 9. Table Status Changed -> Update Live Floor Map
  subscribeToEvent(EventChannels.TABLE_STATUS_CHANGED, (payload: any) => {
    io?.to(`waiter:${payload.venueId}`).emit('table_status_changed', payload);
  });

  // 10. Remote Bill Print Requested -> Relay to Admin Mini POS
  subscribeToEvent(EventChannels.BILL_PRINT_REQUESTED, (payload: any) => {
    io?.to(`venue:${payload.venueId}`).emit('bill_print_job', payload);
  });

  // 11. Food Served -> Update Table and Customer Screens
  subscribeToEvent(EventChannels.FOOD_SERVED, (payload: any) => {
    io?.to(`waiter:${payload.venueId}`).emit('food_served', payload);
    io?.to(`order:${payload.orderId}`).emit('order_status_update', {
      ...payload,
      status: 'SERVED',
    });
  });

  logger.info('⚡ WebSocket Server & Event Bridge initialized');
  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.io has not been initialized. Call initWebSockets first.");
  }
  return io;
};
