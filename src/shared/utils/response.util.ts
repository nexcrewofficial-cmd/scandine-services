import { Response } from "express";
import { successMessage, errorMessage } from "../constants/messages.constant.js";

export * from "../constants/messages.constant.js";

export type MessageType = string | ((field?: string) => string);

export interface SuccessResponseOptions<T = any> {
  data?: T;
  message?: MessageType;
  status?: number;
  meta?: Record<string, any>;
}

export interface ErrorResponseOptions {
  message?: MessageType;
  status?: number;
  error?: any;
}

export const responseUtils = {
  success: <T = any>(
    res: Response,
    options: SuccessResponseOptions<T> = {}
  ): Response => {
    const rawMessage = options.message ?? successMessage.operationSuccess;
    const message = typeof rawMessage === "function" ? rawMessage() : rawMessage;
    const { data, status = 200, meta } = options;

    const responsePayload: Record<string, any> = {
      success: true,
      message,
    };

    if (data !== undefined) {
      responsePayload.data = data;
    }

    if (meta !== undefined) {
      responsePayload.meta = meta;
    }

    return res.status(status).json(responsePayload);
  },

  created: <T = any>(
    res: Response,
    options: SuccessResponseOptions<T> = {}
  ): Response => {
    return responseUtils.success(res, {
      ...options,
      status: options.status || 201,
      message: options.message || successMessage.created(),
    });
  },

  error: (
    res: Response,
    options: ErrorResponseOptions = {}
  ): Response => {
    const rawMessage = options.message ?? errorMessage.internalServerError;
    const message = typeof rawMessage === "function" ? rawMessage() : rawMessage;
    const { status = 500, error } = options;

    return res.status(status).json({
      success: false,
      message,
      ...(error ? { error } : {}),
    });
  },
};
