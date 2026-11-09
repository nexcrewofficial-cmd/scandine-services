import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { logger, requestLogger } from '@scan-and-dine/logger';
import { errorHandler } from '@scan-and-dine/shared-middlewares';
import { authRouter } from './modules/auth/auth.route.js';
import { userStaffRouter } from './modules/users/user.route.js';
import { customerAuthRouter } from './modules/customers/customer.route.js';
import { shiftRouter } from './modules/shifts/shift.route.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'service-auth' });
});

// Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/admin/staff', userStaffRouter);
app.use('/api/v1/public/auth', customerAuthRouter);
app.use('/api/v1/staff', shiftRouter);
app.use('/api/v1/admin', shiftRouter);

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
