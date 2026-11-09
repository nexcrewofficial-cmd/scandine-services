import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { logger, requestLogger } from '@scan-and-dine/logger';
import { errorHandler } from '@scan-and-dine/shared-middlewares';
import { authRoutes } from './routes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'service-auth' });
});

// Default API v1 base prefix
app.use('/api/v1', authRoutes);

// Global Error Handler
app.use(errorHandler);

const startServer = async () => {
  await connectDatabase();
  app.listen(config.port, () => {
    logger.info(`[Service Auth] Running on port ${config.port} in ${config.nodeEnv} mode`);
  });
};

startServer();

export default app;
