import pinoHttp from 'pino-http';
import { logger } from './logger.js';

const pinoHttpMiddleware = (pinoHttp as any).default || (pinoHttp as any);

export const requestLogger = pinoHttpMiddleware({
  logger,
  autoLogging: {
    ignore: (req: any) => req.url === '/health' || req.url?.startsWith('/api/docs'),
  },
  serializers: {
    req: (req: any) => ({
      method: req.method,
      url: req.url,
    }),
    res: (res: any) => ({
      statusCode: res.statusCode,
    }),
  },
  customLogLevel: (_req: any, res: any, err: any) => {
    if (res?.statusCode >= 500 || err) return 'error';
    if (res?.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req: any, res: any, responseTime: number) => {
    return `${req?.method} ${req?.url} -> ${res?.statusCode} (${Math.round(responseTime)}ms)`;
  },
  customErrorMessage: (req: any, res: any, err: any) => {
    return `${req?.method} ${req?.url} -> ${res?.statusCode || 500}: ${err?.message}`;
  },
});

