import { Redis } from 'ioredis';
import { logger } from '@scan-and-dine/logger';

let redisPublisherInstance: Redis | null = null;
let redisSubscriberInstance: Redis | null = null;
let redisOnline = false;
let checkDone = false;

const getRedisConfig = () => ({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 0,
  retryStrategy: () => null, // Do not spam retries if offline
});

export const isRedisAvailable = (): boolean => redisOnline;

export const getRedisPublisher = (): Redis | null => {
  if (!redisPublisherInstance) {
    try {
      redisPublisherInstance = new Redis(getRedisConfig());
      redisPublisherInstance.on('connect', () => {
        redisOnline = true;
        logger.info('✅ Redis Publisher connected');
      });
      redisPublisherInstance.on('error', () => {
        redisOnline = false;
        if (!checkDone) {
          logger.info('💡 Redis offline: using fast in-memory event bus for local dev');
          checkDone = true;
        }
      });
    } catch {
      redisOnline = false;
    }
  }
  return redisPublisherInstance;
};

export const getRedisSubscriber = (): Redis | null => {
  if (!redisSubscriberInstance) {
    try {
      redisSubscriberInstance = new Redis(getRedisConfig());
      redisSubscriberInstance.on('connect', () => {
        redisOnline = true;
      });
      redisSubscriberInstance.on('error', () => {
        redisOnline = false;
      });
    } catch {
      redisOnline = false;
    }
  }
  return redisSubscriberInstance;
};
