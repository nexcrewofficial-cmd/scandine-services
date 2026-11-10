import { Request, Response, NextFunction } from 'express';
import { SubscriptionStatus, UserRole } from '@scan-and-dine/shared-types';
import { AppError } from './app-error.js';

export const requireActiveSubscription = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // Super Admins bypass subscription checks
  if (req.user?.role === UserRole.SUPER_ADMIN) {
    return next();
  }

  const status = req.user?.subscriptionStatus;

  // If status is present in token, check it
  if (status === SubscriptionStatus.PAST_DUE) {
    return next(
      AppError.paymentRequired(
        'Subscription payment is past due. Please update your billing information.'
      )
    );
  }

  if (status === SubscriptionStatus.CANCELLED) {
    return next(
      AppError.paymentRequired(
        'Subscription is cancelled. Please resubscribe to continue using the platform.'
      )
    );
  }

  next();
};
