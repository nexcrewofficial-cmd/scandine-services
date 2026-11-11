import { Request, Response, NextFunction, RequestHandler } from "express";
import { logger } from "../logger/index.js";

export type ControllerHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any> | any;

export const asyncHandler = (fn: ControllerHandler): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await fn(req, res, next);
    } catch (err: any) {
      const errorPayload = err.response?.data || err.message || err;
      console.error("❌ Controller Error:", errorPayload);
      logger.error(
        { err },
        `[Controller Error]: ${typeof errorPayload === "object" ? JSON.stringify(errorPayload) : errorPayload}`
      );
      next(err);
    }
  };
};
