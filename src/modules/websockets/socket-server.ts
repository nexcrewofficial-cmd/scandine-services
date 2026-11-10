import http from 'http';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { logger } from '../../shared/logger/index.js';
import { subscribeToEvent, EventChannels } from '../../shared/event-bus/index.js';
import { config } from '../../config/env.js';

let io: Server | null = null;

export const initWebSockets = (server: http.Server): Server => {
  if (io) return io;

  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
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
          logger.info('Socket.io Redis adapter initialized');
        }
      });
    }).catch(() => {
      logger.info('Socket.io running in local in-memory mode (Redis offline)');
    });
  } catch (err) {
    logger.info('Socket.io running in local in-memory mode');
  }

  // Client Connection Handling & Room Joining
  io.on('connection', (socket: Socket) => {
    logger.debug({ socketId: socket.id }, 'Client connected to WebSocket server');

    // Join Venue Room (Admin, Staff, or Customer)
    socket.on('join_venue', (venueId: string) => {
      socket.join(`venue:${venueId}`);
      logger.debug({ socketId: socket.id, venueId }, 'Joined venue room');
    });

    // Join KDS Kitchen Room
    socket.on('join_kds', (venueId: string) => {
      socket.join(`kds:${venueId}`);
      logger.debug({ socketId: socket.id, venueId }, 'Joined KDS room');
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
  subscribeToEvent(EventChannels.ORDER_CREATED, (payload: any) => {
    io?.to(`kds:${payload.venueId}`).emit('new_order_received', payload);
    io?.to(`waiter:${payload.venueId}`).emit('new_order_received', payload);
  });

  // 2. Order Status Changed -> Notify Customer, KDS, and Waiter
  subscribeToEvent(EventChannels.ORDER_STATUS_CHANGED, (payload: any) => {
    io?.to(`order:${payload.orderId}`).emit('order_status_update', payload);
    io?.to(`venue:${payload.venueId}`).emit('order_status_update', payload);
  });

  // 3. Food Ready at Counter -> Notify Waiter App
  subscribeToEvent(EventChannels.FOOD_READY, (payload: any) => {
    io?.to(`waiter:${payload.venueId}`).emit('food_ready_at_counter', payload);
    io?.to(`order:${payload.orderId}`).emit('order_status_update', {
      ...payload,
      status: 'READY',
    });
  });

  // 4. Call Waiter -> Alert Waiter App
  subscribeToEvent(EventChannels.TABLE_CALL_WAITER, (payload: any) => {
    io?.to(`waiter:${payload.venueId}`).emit('table_needs_service', payload);
  });

  // 5. Item 86-ed / Restocked -> Update Customer Menus
  subscribeToEvent(EventChannels.ITEM_86ED, (payload: any) => {
    io?.to(`venue:${payload.venueId}`).emit('item_stock_updated', payload);
  });

  subscribeToEvent(EventChannels.ITEM_RESTOCKED, (payload: any) => {
    io?.to(`venue:${payload.venueId}`).emit('item_stock_updated', payload);
  });

  // 6. Live Shared Cart Update -> Mirror across devices at that table
  subscribeToEvent(EventChannels.CART_SESSION_UPDATED, (payload: any) => {
    io?.to(`table:${payload.venueId}:${payload.tableNumber}`).emit('cart_updated', payload);
  });

  logger.info('⚡ WebSocket Server & Event Bridge initialized');
  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io has not been initialized. Call initWebSockets first.');
  }
  return io;
};
