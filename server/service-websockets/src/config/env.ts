import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: Number(process.env.PORT_WEBSOCKETS) || 3005,
  nodeEnv: process.env.NODE_ENV || 'development',
  redisHost: process.env.REDIS_HOST || '127.0.0.1',
  redisPort: Number(process.env.REDIS_PORT) || 6379,
  redisPassword: process.env.REDIS_PASSWORD || undefined,
};
