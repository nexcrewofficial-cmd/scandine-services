import { getRedisSubscriber, isRedisAvailable } from './redis-client.js';
import { EventChannels } from './channels.js';
import { logger } from '@scan-and-dine/logger';
import { localEventBus, EventHandler } from './local-bus.js';

export type { EventHandler };

export const subscribeToEvent = async <T = any>(
  channel: EventChannels,
  handler: EventHandler<T>
): Promise<void> => {
  // Always attach to local event bus so dev works 100% without Redis
  localEventBus.on(channel, handler);

  if (!isRedisAvailable()) {
    return;
  }

  try {
    const subscriber = getRedisSubscriber();
    if (subscriber && subscriber.status === 'ready') {
      await subscriber.subscribe(channel);
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
    }
  } catch (err: any) {
    logger.debug({ channel, error: err.message }, 'Redis subscribe skipped');
  }
};
