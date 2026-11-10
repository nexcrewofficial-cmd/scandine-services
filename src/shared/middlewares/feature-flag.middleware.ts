import { Request, Response, NextFunction } from 'express';
import { IFeatureFlags } from '@scan-and-dine/shared-types';
import { AppError } from './app-error.js';

export const requireFeatureFlag = (flagName: keyof IFeatureFlags) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // If venue feature flags are attached to request or check against venue config
    const venueFlags = (req as any).venueFeatureFlags as IFeatureFlags | undefined;

    if (venueFlags && !venueFlags[flagName]) {
      return next(
        AppError.forbidden(
          `Module locked: Feature '${String(flagName)}' is not enabled on this venue subscription plan.`
        )
      );
    }

    next();
  };
};
