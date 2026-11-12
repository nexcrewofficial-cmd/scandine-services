import { Request, Response, NextFunction } from "express";
import { SubscriptionStatus, UserRole } from "@scan-and-dine/shared-types";
import { AppError, errorMessage } from "../constants/messages.constant.js";

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
      AppError.paymentRequired(errorMessage.subscriptionPastDue)
    );
  }

  if (status === SubscriptionStatus.CANCELLED) {
    return next(
      AppError.paymentRequired(errorMessage.subscriptionCancelled)
    );
  }

  next();
};
