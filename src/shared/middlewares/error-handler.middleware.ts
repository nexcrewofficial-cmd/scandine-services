import { Request, Response, NextFunction } from "express";
import { APIError } from "./app-error.js";
import { AppError, errorMessage } from "../constants/messages.constant.js";
import { logger } from "@scan-and-dine/logger";
import { ZodError } from "zod";

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
      error: errorMessage.validationFailed,
      message: errorMessage.validationFailed,
      details: err.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  // Handle Known APIError & AppError
  if (err instanceof APIError || err instanceof AppError) {
    const apiErr = err as APIError;
    const statusCode = apiErr.statusCode || 500;

    if (statusCode >= 500) {
      logger.error({ err }, `Server Error [${statusCode}]: ${apiErr.message}`);
    } else {
      logger.warn(`Client Error [${statusCode}]: ${apiErr.message}`);
    }

    res.status(statusCode).json({
      success: false,
      message: apiErr.message,
      error: apiErr.message,
      ...(apiErr.errorCode ? { errorCode: apiErr.errorCode } : {}),
      ...(apiErr.data !== undefined ? { data: apiErr.data } : {}),
      ...((apiErr as any).details && apiErr.data === undefined ? { details: (apiErr as any).details } : {}),
    });
    return;
  }

  // Handle Unexpected Errors
  logger.error({ err }, "Unhandled Unexpected Exception");
  res.status(500).json({
    success: false,
    error: errorMessage.internalServerError,
    message: errorMessage.internalServerError,
    ...(process.env.NODE_ENV !== "production" ? { stack: err.stack, message: err.message } : {}),
  });
};
