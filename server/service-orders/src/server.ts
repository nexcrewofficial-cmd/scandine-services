import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { logger, requestLogger } from '@scan-and-dine/logger';
import { errorHandler } from '@scan-and-dine/shared-middlewares';
import { orderRoutes } from './routes.js';
import { OrderArchiveCron } from './modules/orders/order-archive.cron.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'service-orders' });
});

// Default API v1 base prefix
app.use('/api/v1', orderRoutes);

// Global Error Handler
app.use(errorHandler);

const startServer = async () => {
  await connectDatabase();
  OrderArchiveCron.initScheduler();
  app.listen(config.port, () => {
    logger.info(`[Service Orders] Running on port ${config.port} in ${config.nodeEnv} mode`);
  });
};

startServer();

export default app;
