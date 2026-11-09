import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { logger, requestLogger } from '@scan-and-dine/logger';
import { errorHandler } from '@scan-and-dine/shared-middlewares';
import { venueRouter } from './modules/venues/venue.route.js';
import { categoryRouter } from './modules/categories/category.route.js';
import { menuItemRouter } from './modules/menu-items/menu-item.route.js';
import { inventoryRouter } from './modules/inventory/inventory.route.js';
import { promoRouter } from './modules/promos/promo.route.js';
import { printerRouter } from './modules/printers/printer.route.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'service-menu' });
});

// Routes
app.use('/api/v1/admin/settings', venueRouter);
app.use('/api/v1/admin/menu/categories', categoryRouter);
app.use('/api/v1/admin/menu/items', menuItemRouter);
app.use('/api/v1/public/menu', menuItemRouter);
app.use('/api/v1/admin/inventory', inventoryRouter);
app.use('/api/v1/admin/promos', promoRouter);
app.use('/api/v1/admin/printers', printerRouter);

// Global Error Handler
app.use(errorHandler);

const startServer = async () => {
  await connectDatabase();
  app.listen(config.port, () => {
    logger.info(`[Service Menu] Running on port ${config.port} in ${config.nodeEnv} mode`);
  });
};

startServer();

export default app;
