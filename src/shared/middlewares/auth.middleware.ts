import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './app-error.js';
import { UserRole, SubscriptionStatus } from '@scan-and-dine/shared-types';

export interface AuthenticatedUser {
  userId: string;
  venueId?: string;
  role: UserRole;
  email?: string;
  subscriptionStatus?: SubscriptionStatus;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      venueId?: string;
      customerUUID?: string;
    }
  }
}

export const authenticateJwt = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw AppError.unauthorized('No authorization token provided');
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production';

  try {
    const decoded = jwt.verify(token, secret) as AuthenticatedUser;
    req.user = decoded;
    if (decoded.venueId) {
      req.venueId = decoded.venueId;
    }
    next();
  } catch (err) {
    throw AppError.unauthorized('Invalid or expired token');
  }
};

export const optionalJwt = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production';

  try {
    const decoded = jwt.verify(token, secret) as AuthenticatedUser;
    req.user = decoded;
    if (decoded.venueId) {
      req.venueId = decoded.venueId;
    }
  } catch {
    // Silently continue for optional authentication
  }
  next();
};
