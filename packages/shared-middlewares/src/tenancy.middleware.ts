import { Request, Response, NextFunction } from 'express';
import { AppError } from './app-error.js';
import { UserRole } from '@scan-and-dine/shared-types';

export const requireVenueId = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // Super Admin can bypass venueId scoping if querying global routes
  if (req.user?.role === UserRole.SUPER_ADMIN && !req.venueId) {
    return next();
  }

  // Extract from user token, query parameter, route param, or header
  const venueId =
    req.user?.venueId ||
    (req.params.venueId as string) ||
    (req.query.venueId as string) ||
    (req.headers['x-venue-id'] as string);

  if (!venueId) {
    return next(
      AppError.badRequest('Tenant identification required: Missing venueId in request context')
    );
  }

  req.venueId = venueId;
  next();
};

export const requireCustomerDevice = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const deviceUUID = (req.headers['x-device-uuid'] as string) || (req.body?.customerUUID as string);

  if (!deviceUUID) {
    return next(
      AppError.badRequest('Customer identification required: Missing x-device-uuid header')
    );
  }

  req.customerUUID = deviceUUID;
  next();
};
