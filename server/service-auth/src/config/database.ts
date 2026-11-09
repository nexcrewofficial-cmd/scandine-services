import mongoose from 'mongoose';
import { logger } from '@scan-and-dine/logger';
import { config } from './env.js';

export const connectDatabase = async (): Promise<void> => {
  try {
    const maxPoolSize = Number(process.env.MONGO_MAX_POOL_SIZE) || 20;
    const minPoolSize = Number(process.env.MONGO_MIN_POOL_SIZE) || 2;

    await mongoose.connect(config.mongoUri, {
      maxPoolSize,
      minPoolSize,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info(`Connected to MongoDB Atlas (service-auth) [Pool: min=${minPoolSize}, max=${maxPoolSize}]`);
  } catch (err) {
    logger.error({ err }, 'Failed to connect to MongoDB Atlas');
    process.exit(1);
  }
};
