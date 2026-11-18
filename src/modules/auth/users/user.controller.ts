import { Request, Response } from "express";
import { UserService } from "./user.service.js";
import { asyncHandler, responseUtils, successMessage } from "../../../shared/middlewares/index.js";

export class UserController {
  static listStaff = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const { data, meta } = await UserService.getStaffByVenue(venueId, req.query);
    return responseUtils.list(res, {
      key: "staff",
      data,
      meta,
    });
  });

  static getStaff = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const data = await UserService.getStaffById(venueId, req.params.id as string);
    return responseUtils.success(res, {
      data,
      message: successMessage.dataFetched,
      status: 200,
    });
  });

  static createStaff = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const data = await UserService.createStaff(venueId, req.body);
    return responseUtils.success(res, {
      data,
      message: successMessage.created,
      status: 201,
    });
  });

  static updateStaff = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const data = await UserService.updateStaff(venueId, req.params.id as string, req.body);
    return responseUtils.success(res, {
      data,
      message: successMessage.updated,
      status: 200,
    });
  });

  static deleteStaff = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    await UserService.deactivateStaff(venueId, req.params.id as string);
    return responseUtils.success(res, {
      message: successMessage.deleted,
      status: 200,
    });
  });
}
