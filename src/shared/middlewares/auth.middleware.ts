import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError, errorMessage } from "../constants/messages.constant.js";
import { UserRole, SubscriptionStatus } from "@scan-and-dine/shared-types";

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
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw AppError.unauthorized(errorMessage.unauthorized);
  }

  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET || "super_secret_jwt_key_change_in_production";

  try {
    const decoded = jwt.verify(token, secret) as AuthenticatedUser;
    if (decoded.role === UserRole.SUPER_ADMIN) {
      return next(AppError.forbidden(errorMessage.forbidden));
    }
    req.user = decoded;
    if (decoded.venueId) {
      req.venueId = decoded.venueId;
    }
    next();
  } catch (err) {
    throw AppError.unauthorized(errorMessage.tokenExpired);
  }
};

export const optionalJwt = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET || "super_secret_jwt_key_change_in_production";

  try {
    const decoded = jwt.verify(token, secret) as AuthenticatedUser;
    if (decoded.role === UserRole.SUPER_ADMIN) {
      return next(AppError.forbidden(errorMessage.forbidden));
    }
    req.user = decoded;
    if (decoded.venueId) {
      req.venueId = decoded.venueId;
    }
  } catch {
    // Silently continue for optional authentication
  }
  next();
};
