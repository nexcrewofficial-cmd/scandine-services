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

export interface ListResponseOptions<T = any> {
  key: string;
  data: T[];
  totalCount?: number;
  extraKeys?: string[];
  message?: MessageType;
  status?: number;
  meta?: {
    total?: number;
    count?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    hasPaging?: boolean;
    [key: string]: any;
  };
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

  list: <T = any>(
    res: Response,
    options: ListResponseOptions<T>
  ): Response => {
    const { key, data, totalCount, extraKeys, status = 200, message, meta } = options;
    const items = Array.isArray(data) ? data : [];
    const count =
      totalCount !== undefined
        ? totalCount
        : (meta?.total ?? meta?.count ?? items.length);

    const dataPayload: Record<string, any> = {
      [key]: items,
    };

    if (extraKeys && Array.isArray(extraKeys)) {
      for (const extraKey of extraKeys) {
        if (extraKey && typeof extraKey === "string" && extraKey !== key) {
          dataPayload[extraKey] = items;
        }
      }
    }

    dataPayload.totalCount = count;

    if (meta?.hasPaging) {
      dataPayload.page = meta.page;
      dataPayload.limit = meta.limit;
      dataPayload.totalPages = meta.totalPages;
    }

    const responsePayload: Record<string, any> = {
      success: true,
      data: dataPayload,
    };

    if (message !== undefined) {
      const rawMessage = message;
      responsePayload.message = typeof rawMessage === "function" ? rawMessage() : rawMessage;
    }

    return res.status(status).json(responsePayload);
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
