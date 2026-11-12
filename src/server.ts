import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/env.js';
import { logger, requestLogger } from './shared/logger/index.js';
import { errorHandler } from './shared/middlewares/index.js';
import { authRoutes } from './modules/auth/routes.js';
import { menuRoutes } from './modules/menu/routes.js';
import { orderRoutes } from './modules/orders/routes.js';
import { initWebSockets } from './modules/websockets/socket-server.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Standard Middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
  })
);
app.use(express.json());
app.use(requestLogger);

// Health Check
app.get(['/health', '/api/v1/health'], (_req, res) => {
  res.status(200).json({
    status: 'online',
    service: config.serviceName === 'ALL' ? 'scan-and-dine-unified' : `service-${config.serviceName.toLowerCase()}`,
    mode: config.serviceName === 'ALL' ? 'modular-unified' : 'microservice',
    port: config.port,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Swagger Interactive API Documentation & Raw OpenAPI Spec
try {
  const candidate1 = path.join(__dirname, "docs", "openapi.json");
  const candidate2 = path.join(process.cwd(), "src", "docs", "openapi.json");
  const openapiPath = fs.existsSync(candidate1) ? candidate1 : (fs.existsSync(candidate2) ? candidate2 : null);

  if (openapiPath && fs.existsSync(openapiPath)) {
    const swaggerDoc = JSON.parse(fs.readFileSync(openapiPath, "utf8"));
    app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));
    app.get("/api/docs.json", (_req, res) => {
      res.setHeader("Content-Type", "application/json");
      res.send(swaggerDoc);
    });
    logger.info(`📖 Swagger Docs ready at http://localhost:${config.port}/api/docs`);
    logger.info(`📄 OpenAPI Schema ready at http://localhost:${config.port}/api/docs.json`);
  }
} catch (err) {
  logger.warn("OpenAPI documentation not mounted");
}

// =========================================================================
// ROUTING LAYER: Supports Unified Dev Mode & Microservice Runners
// =========================================================================
const service = config.serviceName.toUpperCase();

if (service === 'AUTH') {
  app.use('/api/v1', authRoutes);
  logger.info('Mounting ONLY Service Auth domain (/api/v1)');
} else if (service === 'MENU') {
  app.use('/api/v1', menuRoutes);
  logger.info('Mounting ONLY Service Menu domain (/api/v1)');
} else if (service === 'ORDERS') {
  app.use('/api/v1', orderRoutes);
  logger.info('Mounting ONLY Service Orders domain (/api/v1)');
} else {
  // Default: 'ALL' -> Unified Modular Server
  app.use('/api/v1', authRoutes);
  app.use('/api/v1', menuRoutes);
  app.use('/api/v1', orderRoutes);
  logger.info('Mounting ALL domains under master prefix /api/v1');
}

// Global Error Handler
app.use(errorHandler);

// Database Connection
const connectDB = async () => {
  try {
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(config.mongo.uri, {
      maxPoolSize: config.mongo.maxPoolSize,
      serverSelectionTimeoutMS: 5000,
    });
    logger.info('✅ MongoDB Connected Successfully');
  } catch (err: any) {
    logger.error({ err: err.message }, '❌ MongoDB Connection Failed');
  }
};

// Create HTTP Server & Initialize WebSockets
const server = http.createServer(app);

if (service === 'ALL' || service === 'WS') {
  initWebSockets(server);
}

// Start Server
const startServer = async () => {
  await connectDB();

  server.listen(config.port, () => {
    logger.info(`======================================================`);
    logger.info(`🚀 Scan & Dine Backend Online on PORT ${config.port}`);
    logger.info(`📡 Base REST API : http://localhost:${config.port}/api/v1/`);
    logger.info(`📑 Swagger Docs  : http://localhost:${config.port}/api/docs`);
    logger.info(`🔌 WebSockets    : ws://localhost:${config.port}`);
    logger.info(`🎯 Service Mode  : ${config.serviceName}`);
    logger.info(`======================================================`);
  });
};

startServer();

export { app, server };
