import { getRedisPublisher } from './redis-client.js';
import { EventChannels } from './channels.js';
import { logger } from '@scan-and-dine/logger';

export const publishEvent = async <T extends { venueId: string }>(
  channel: EventChannels,
  payload: T
): Promise<void> => {
  try {
    const redis = getRedisPublisher();
    if (redis.status !== 'ready' && redis.status !== 'connecting') {
      logger.debug({ channel }, 'Redis not ready, skipping event publication in dev mode');
      return;
    }
    const message = JSON.stringify({
      ...payload,
      timestamp: new Date().toISOString(),
    });
    await redis.publish(channel, message);
    logger.debug({ channel, venueId: payload.venueId }, 'Event published to Redis bus');
  } catch (error: any) {
    logger.warn({ error: error.message, channel }, 'Could not publish event to Redis bus (offline mode)');
  }
};
