import { getRedisPublisher, isRedisAvailable } from './redis-client.js';
import { EventChannels } from './channels.js';
import { logger } from '@scan-and-dine/logger';
import { localEventBus } from './local-bus.js';

export const publishEvent = async <T extends { venueId: string }>(
  channel: EventChannels,
  payload: T
): Promise<void> => {
  // Always trigger local bus so dev works instantly with 0 latency
  localEventBus.emit(channel, payload);

  if (!isRedisAvailable()) {
    return;
  }

  try {
    const redis = getRedisPublisher();
    if (redis && redis.status === 'ready') {
      const message = JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString(),
      });
      await redis.publish(channel, message);
      logger.debug({ channel, venueId: payload.venueId }, 'Event published to Redis bus');
    }
  } catch (error: any) {
    logger.debug({ error: error.message, channel }, 'Redis publish skipped');
  }
};
