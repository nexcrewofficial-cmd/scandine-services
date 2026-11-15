import { Request, Response } from "express";
import { ShiftService } from "./shift.service.js";
import { asyncHandler, responseUtils, successMessage } from "../../../shared/middlewares/index.js";

export class ShiftController {
  static clockIn = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const userId = req.user!.userId;
    const data = await ShiftService.clockIn(venueId, userId);
    return responseUtils.success(res, {
      data,
      message: successMessage.clockedIn,
      status: 200,
    });
  });

  static clockOut = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const userId = req.user!.userId;
    const data = await ShiftService.clockOut(venueId, userId);
    return responseUtils.success(res, {
      data,
      message: successMessage.clockedOut,
      status: 200,
    });
  });

  static listShifts = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const { data, meta } = await ShiftService.listShifts(venueId, req.query);
    return responseUtils.list(res, {
      key: "shifts",
      extraKeys: ["shift"],
      data,
      meta,
    });
  });
}
