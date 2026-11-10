import { EventEmitter } from 'events';

export type EventHandler<T = any> = (payload: T) => void | Promise<void>;

export const localEventBus = new EventEmitter();
localEventBus.setMaxListeners(100);
