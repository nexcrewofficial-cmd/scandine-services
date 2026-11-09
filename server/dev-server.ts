import http from 'http';
import express, { Router } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import { Server, Socket } from 'socket.io';
import { logger, requestLogger } from '@scan-and-dine/logger';
import { errorHandler } from '@scan-and-dine/shared-middlewares';
import { subscribeToEvent, EventChannels } from '@scan-and-dine/event-bus';

// Load environment variables
dotenv.config();

// Master Routers from each Service
import { authRoutes } from './service-auth/src/routes.js';
import { menuRoutes } from './service-menu/src/routes.js';
import { orderRoutes } from './service-orders/src/routes.js';

const app = express();
const PORT = Number(process.env.PORT || process.env.PORT_GATEWAY || 3000);
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/scan-and-dine';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(requestLogger);

// Health Check
app.get(['/health', '/api/v1/health'], (_req, res) => {
  res.status(200).json({
    status: 'online',
    mode: 'unified-development-server',
    port: PORT,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Swagger Interactive Documentation
try {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const openApiPath = path.join(__dirname, 'api-gateway', 'src', 'docs', 'openapi.json');
  if (fs.existsSync(openApiPath)) {
    const swaggerDoc = JSON.parse(fs.readFileSync(openApiPath, 'utf-8'));
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
    app.get('/api/openapi.json', (_req, res) => res.json(swaggerDoc));
    logger.info(`📑 Interactive Swagger Docs available at http://localhost:${PORT}/api/docs`);
  }
} catch (err) {
  logger.warn('Swagger docs could not be loaded in dev-server');
}

// ==========================================
// DEFAULT /api/v1 BASE PREFIX (NO REPETITION)
// ==========================================
const apiV1Router = Router();
apiV1Router.use(authRoutes);
apiV1Router.use(menuRoutes);
apiV1Router.use(orderRoutes);

// Mount once globally
app.use('/api/v1', apiV1Router);

// Global Error Handler
app.use(errorHandler);

// ==========================================
// HTTP & WEBSOCKET ENGINE (SAME PORT 3000)
// ==========================================
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

io.on('connection', (socket: Socket) => {
  logger.debug({ socketId: socket.id }, 'Client connected to unified WebSocket server');

  socket.on('join_venue', (venueId: string) => {
    socket.join(`venue:${venueId}`);
    logger.debug({ socketId: socket.id, venueId }, 'Joined venue room');
  });

  socket.on('join_kds', (venueId: string) => {
    socket.join(`kds:${venueId}`);
    logger.debug({ socketId: socket.id, venueId }, 'Joined KDS room');
  });

  socket.on('join_table', ({ venueId, tableNumber }: { venueId: string; tableNumber: string }) => {
    socket.join(`table:${venueId}:${tableNumber}`);
    logger.debug({ socketId: socket.id, venueId, tableNumber }, 'Joined table room');
  });

  socket.on('disconnect', () => {
    logger.debug({ socketId: socket.id }, 'Client disconnected');
  });
});

// Event Bus to Socket.io Bridge
const setupEventBridge = async () => {
  try {
    await subscribeToEvent(EventChannels.ORDER_CREATED, (data) => {
      io.to(`venue:${data.venueId}`).emit('order_created', data);
      io.to(`kds:${data.venueId}`).emit('order_created', data);
      io.to(`table:${data.venueId}:${data.tableNumber}`).emit('order_status_update', data);
    });

    await subscribeToEvent(EventChannels.ORDER_STATUS_CHANGED, (data) => {
      io.to(`venue:${data.venueId}`).emit('table_status_changed', data);
      io.to(`kds:${data.venueId}`).emit('ticket_status_changed', data);
      io.to(`table:${data.venueId}:${data.tableNumber}`).emit('order_status_update', data);
    });

    await subscribeToEvent(EventChannels.ITEM_86ED, (data) => {
      io.to(`venue:${data.venueId}`).emit('item_stock_updated', data);
    });

    await subscribeToEvent(EventChannels.FOOD_READY, (data) => {
      io.to(`venue:${data.venueId}`).emit('food_ready', data);
      io.to(`table:${data.venueId}:${data.tableNumber}`).emit('food_ready', data);
    });

    logger.info('⚡ Redis-to-WebSocket Event Bridge active');
  } catch (err) {
    logger.warn('Event bridge running in standalone mode');
  }
};

// ==========================================
// BOOTSTRAP UNIFIED SERVER
// ==========================================
const startDevServer = async () => {
  try {
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 20),
    });
    logger.info('✅ MongoDB Connected Successfully');

    await setupEventBridge();

    server.listen(PORT, () => {
      console.log('\n======================================================');
      console.log(`🚀 Scan & Dine Unified Dev Server Online on PORT ${PORT}`);
      console.log(`📡 Base REST API : http://localhost:${PORT}/api/v1/`);
      console.log(`📑 Swagger Docs  : http://localhost:${PORT}/api/docs`);
      console.log(`🔌 WebSockets    : ws://localhost:${PORT} (same port)`);
      console.log(`💚 Health Check  : http://localhost:${PORT}/api/v1/health`);
      console.log('======================================================\n');
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start Unified Dev Server');
    process.exit(1);
  }
};

startDevServer();
