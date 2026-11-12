import { Request, Response, NextFunction } from "express";
import { UserRole } from "@scan-and-dine/shared-types";
import { AppError, errorMessage } from "../constants/messages.constant.js";

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized(errorMessage.unauthorized));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        AppError.forbidden(errorMessage.forbidden)
      );
    }

    next();
  };
};
