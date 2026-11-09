import { getRedisSubscriber } from './redis-client.js';
import { EventChannels } from './channels.js';
import { logger } from '@scan-and-dine/logger';

export type EventHandler<T = any> = (payload: T) => void | Promise<void>;

export const subscribeToEvent = async <T = any>(
  channel: EventChannels,
  handler: EventHandler<T>
): Promise<void> => {
  try {
    const subscriber = getRedisSubscriber();
    await subscriber.subscribe(channel);
    logger.info({ channel }, 'Subscribed to Redis channel');

    subscriber.on('message', (receivedChannel, message) => {
      if (receivedChannel === channel) {
        try {
          const parsed = JSON.parse(message);
          handler(parsed);
        } catch (err) {
          logger.error({ err, channel }, 'Failed to parse incoming event message');
        }
      }
    });
  } catch (err: any) {
    logger.warn({ channel, error: err.message }, 'Failed to subscribe to Redis channel (offline mode)');
  }
};
