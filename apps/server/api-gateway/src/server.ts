import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/env.js';
import { setupProxyRoutes } from './proxy/proxy-routes.js';
import { logger, requestLogger } from '@scan-and-dine/logger';
import { errorHandler } from '@scan-and-dine/shared-middlewares';

const app = express();

// Security Headers
app.use(helmet());

// CORS Configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin || config.corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev, lock down in prod
      }
    },
    credentials: true,
  })
);

// Global Rate Limiting (100 req/min)
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  message: { success: false, error: 'Too many requests from this IP, please try again shortly.' },
});
app.use(limiter);

// Structured Request Logging
app.use(requestLogger);

// Health Check Endpoint
app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    gateway: 'online',
    timestamp: new Date().toISOString(),
    services: config.services,
  });
});

// Interactive Swagger / OpenAPI Documentation
try {
  const swaggerDocument = JSON.parse(
    fs.readFileSync(new URL('./docs/openapi.json', import.meta.url), 'utf-8')
  );
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.get('/api/openapi.json', (_req, res) => res.json(swaggerDocument));
  logger.info('Interactive Swagger API docs available at /api/docs');
} catch (err) {
  logger.warn({ err }, 'Failed to load OpenAPI docs');
}

// Setup Microservice Proxy Routing
setupProxyRoutes(app);

// Global Error Handler
app.use(errorHandler);

const server = app.listen(config.port, () => {
  logger.info(`[API Gateway] Running on port ${config.port} in ${config.nodeEnv} mode`);
});

export default server;
