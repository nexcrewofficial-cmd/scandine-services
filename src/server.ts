import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import http from "http";

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/env.js';
import { logger, requestLogger } from "./shared/logger/index.js";
import { errorHandler } from "./shared/middlewares/index.js";
import { authRoutes } from "./modules/auth/routes.js";
import { menuRoutes } from "./modules/menu/routes.js";
import { orderRoutes } from "./modules/orders/routes.js";
import { initWebSockets } from "./modules/websockets/socket-server.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Standard Middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(requestLogger);
app.use(express.json());

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
} else if (service === 'MENU') {
  app.use('/api/v1', menuRoutes);
} else if (service === 'ORDERS') {
  app.use('/api/v1', orderRoutes);
} else {
  // Default: 'ALL' -> Unified Modular Server
  app.use('/api/v1', authRoutes);
  app.use('/api/v1', menuRoutes);
  app.use('/api/v1', orderRoutes);
}

// Global Error Handler
app.use(errorHandler);

// Database Connection
const connectDB = async () => {
  try {
    await mongoose.connect(config.mongo.uri, {
      maxPoolSize: config.mongo.maxPoolSize,
      serverSelectionTimeoutMS: 5000,
    });
    console.log("Connected to db 🚀");
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
    console.log(`Server Running on ${config.port} 🚀`);
  });
};

startServer();

export { app, server };
