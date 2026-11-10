import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@scan-and-dine/shared-types';
import { AppError } from './app-error.js';

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        AppError.forbidden(`Access denied: Requires one of [${allowedRoles.join(', ')}]`)
      );
    }

    next();
  };
};
