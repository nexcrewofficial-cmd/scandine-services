import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { logger, requestLogger } from '@scan-and-dine/logger';
import { errorHandler } from '@scan-and-dine/shared-middlewares';
import { orderRouter } from './modules/orders/order.route.js';
import { cartRouter } from './modules/cart/cart.route.js';
import { checkoutRouter } from './modules/checkout/checkout.route.js';
import { kdsRouter } from './modules/kds/kds.route.js';
import { transactionRouter } from './modules/transactions/transaction.route.js';
import { dashboardRouter } from './modules/dashboard/dashboard.route.js';
import { webhookRouter } from './modules/webhooks/webhook.route.js';
import { OrderArchiveCron } from './modules/orders/order-archive.cron.js';

const app = express();

app.use(cors());

// Webhooks must precede generic express.json middleware for signature verification
app.use('/api/v1/webhooks', webhookRouter);

app.use(express.json());
app.use(requestLogger);

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'service-orders' });
});

// Routes
app.use('/api/v1/public/orders', orderRouter);
app.use('/api/v1/waiter/orders', orderRouter);
app.use('/api/v1/public/cart', cartRouter);
app.use('/api/v1/public/checkout', checkoutRouter);
app.use('/api/v1/kds', kdsRouter);
app.use('/api/v1/admin/transactions', transactionRouter);
app.use('/api/v1/admin/dashboard', dashboardRouter);

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
