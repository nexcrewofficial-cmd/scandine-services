import { Response } from 'express';

export interface SuccessResponseOptions<T = any> {
  data?: T;
  message?: string;
  status?: number;
  meta?: Record<string, any>;
}

export interface ErrorResponseOptions {
  message?: string;
  status?: number;
  error?: any;
}

export const successMessage = {
  dataFetched: 'Data fetched successfully',
  created: 'Resource created successfully',
  updated: 'Resource updated successfully',
  deleted: 'Resource deleted successfully',
  loginSuccess: 'Logged in successfully',
  logoutSuccess: 'Logged out successfully',
  operationSuccess: 'Operation completed successfully',
  itemAddedToCart: 'Item added to cart successfully',
  cartCleared: 'Cart cleared successfully',
  orderCreated: 'Order created successfully',
  orderStatusUpdated: 'Order status updated successfully',
  waiterCalled: 'Waiter has been called to your table',
  refundProcessed: 'Refund processed successfully',
  clockedIn: 'Clocked in successfully',
  clockedOut: 'Clocked out successfully',
} as const;

export const responseUtils = {
  success: <T = any>(
    res: Response,
    options: SuccessResponseOptions<T> = {}
  ): Response => {
    const {
      data,
      message = successMessage.operationSuccess,
      status = 200,
      meta,
    } = options;

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
      message: options.message || successMessage.created,
    });
  },

  error: (
    res: Response,
    options: ErrorResponseOptions = {}
  ): Response => {
    const {
      message = 'An unexpected error occurred',
      status = 500,
      error,
    } = options;

    return res.status(status).json({
      success: false,
      message,
      ...(error ? { error } : {}),
    });
  },
};
