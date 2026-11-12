import { Request, Response, NextFunction } from "express";
import { AppError, errorMessage } from "../constants/messages.constant.js";

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

export const requireGeofence = (options: GeofenceOptions) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const latHeader = req.headers["x-user-latitude"];
    const lonHeader = req.headers["x-user-longitude"];

    const userLat = latHeader ? parseFloat(latHeader as string) : null;
    const userLon = lonHeader ? parseFloat(lonHeader as string) : null;

    if (userLat === null || userLon === null || isNaN(userLat) || isNaN(userLon)) {
      // In development or if device GPS is pending, allow graceful fallback
      if (process.env.NODE_ENV !== "production") {
        return next();
      }
      return next(
        AppError.badRequest(errorMessage.isRequired("GPS Location (x-user-latitude / x-user-longitude)"))
      );
    }

    const [venueLon, venueLat] = options.venueCoordinates;
    const allowedRadius = options.radiusMeters || 200;

    const distance = calculateDistanceMeters(userLat, userLon, venueLat, venueLon);

    if (distance > allowedRadius) {
      return next(
        AppError.forbidden(errorMessage.outsideGeofence)
      );
    }

    next();
  };
};
