import { Request, Response, NextFunction } from 'express';
import { AppError } from './app-error.js';
import { logger } from '@scan-and-dine/logger';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Handle Known AppErrors
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err }, `Server Error [${err.statusCode}]: ${err.message}`);
    } else {
      logger.warn(`Client Error [${err.statusCode}]: ${err.message}`);
    }

    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  // Handle Unexpected Errors
  logger.error({ err }, 'Unhandled Unexpected Exception');
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack, message: err.message } : {}),
  });
};
