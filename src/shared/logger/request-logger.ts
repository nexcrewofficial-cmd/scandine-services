import pinoHttp from 'pino-http';
import { logger } from './logger.js';

const pinoHttpMiddleware = (pinoHttp as any).default || (pinoHttp as any);

export const requestLogger = pinoHttpMiddleware({
  logger,
  customLogLevel: (_req: any, res: any, err: any) => {
    if (res?.statusCode >= 500 || err) return 'error';
    if (res?.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req: any, res: any) => {
    return `${req?.method} ${req?.url} completed with status ${res?.statusCode}`;
  },
  customErrorMessage: (req: any, _res: any, err: any) => {
    return `${req?.method} ${req?.url} failed: ${err?.message}`;
  },
});
