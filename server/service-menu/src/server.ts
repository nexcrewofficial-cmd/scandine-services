import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { logger, requestLogger } from '@scan-and-dine/logger';
import { errorHandler } from '@scan-and-dine/shared-middlewares';
import { menuRoutes } from './routes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'service-menu' });
});

// Default API v1 base prefix
app.use('/api/v1', menuRoutes);

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
