import { Redis } from 'ioredis';
import { logger } from '@scan-and-dine/logger';

let redisPublisherInstance: Redis | null = null;
let redisSubscriberInstance: Redis | null = null;
let isRedisOffline = false;

const getRedisConfig = () => ({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  retryStrategy(times: number) {
    if (times > 3) {
      if (!isRedisOffline) {
        logger.warn('Redis not detected locally. Degrading to graceful offline fallback for dev mode.');
        isRedisOffline = true;
      }
      return null; // Stop infinite reconnect loop in dev
    }
    return Math.min(times * 100, 1000);
  },
});

export const getRedisPublisher = (): Redis => {
  if (!redisPublisherInstance) {
    redisPublisherInstance = new Redis(getRedisConfig());
    redisPublisherInstance.on('connect', () => {
      isRedisOffline = false;
      logger.info('Redis Publisher client connected');
    });
    redisPublisherInstance.on('error', (err) => {
      if (!isRedisOffline) {
        logger.warn({ err: err.message }, 'Redis Publisher client connection failed (running in offline fallback)');
      }
    });
  }
  return redisPublisherInstance;
};

export const getRedisSubscriber = (): Redis => {
  if (!redisSubscriberInstance) {
    redisSubscriberInstance = new Redis(getRedisConfig());
    redisSubscriberInstance.on('connect', () => {
      isRedisOffline = false;
      logger.info('Redis Subscriber client connected');
    });
    redisSubscriberInstance.on('error', (err) => {
      if (!isRedisOffline) {
        logger.warn({ err: err.message }, 'Redis Subscriber client connection failed (running in offline fallback)');
      }
    });
  }
  return redisSubscriberInstance;
};
