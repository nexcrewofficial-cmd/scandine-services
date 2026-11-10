import { Request, Response, NextFunction } from 'express';
import { AppError } from './app-error.js';

/**
 * Calculates great-circle distance between two GPS coordinates using the Haversine formula
 * @returns distance in meters
 */
export const calculateDistanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

export interface GeofenceOptions {
  venueCoordinates: [number, number]; // [Longitude, Latitude]
  radiusMeters?: number; // Default: 200m
}

export const validateGeofence = (options: GeofenceOptions) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // Extract user GPS from headers or request body
    const userLat = Number(req.headers['x-user-latitude'] || req.body?.latitude);
    const userLon = Number(req.headers['x-user-longitude'] || req.body?.longitude);

    if (isNaN(userLat) || isNaN(userLon)) {
      // In development or if device GPS is pending, allow graceful fallback
      if (process.env.NODE_ENV !== 'production') {
        return next();
      }
      return next(
        AppError.badRequest('Location verification required: Please allow GPS location to place order on-premises.')
      );
    }

    const [venueLon, venueLat] = options.venueCoordinates;
    const allowedRadius = options.radiusMeters || 200;

    const distance = calculateDistanceMeters(userLat, userLon, venueLat, venueLon);

    if (distance > allowedRadius) {
      return next(
        AppError.forbidden(
          `Location verification failed: You are ${distance}m away from the venue (Max allowed: ${allowedRadius}m). Orders can only be placed on-premises.`
        )
      );
    }

    next();
  };
};
