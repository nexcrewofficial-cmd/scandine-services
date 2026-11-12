import { Request, Response, NextFunction } from "express";
import { IFeatureFlags } from "@scan-and-dine/shared-types";
import { AppError, errorMessage } from "../constants/messages.constant.js";

export const requireFeatureFlag = (flagName: keyof IFeatureFlags) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // If venue feature flags are attached to request or check against venue config
    const venueFlags = (req as any).venueFeatureFlags as IFeatureFlags | undefined;

    if (venueFlags && !venueFlags[flagName]) {
      return next(
        AppError.forbidden(errorMessage.featureLocked(String(flagName)))
      );
    }

    next();
  };
};
