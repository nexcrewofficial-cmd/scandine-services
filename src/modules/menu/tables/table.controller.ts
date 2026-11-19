import { Request, Response } from "express";
import { TableService } from "./table.service.js";
import { asyncHandler, responseUtils, successMessage } from "../../../shared/middlewares/index.js";

export class TableController {
  static list = asyncHandler(async (req: Request, res: Response) => {
    const data = await TableService.list(req.venueId!);
    return responseUtils.success(res, {
      data, message: successMessage.fetched("Tables"), status: 200, meta: { count: data.length },
    });
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const data = await TableService.getById(req.venueId!, req.params.id as string);
    return responseUtils.success(res, { data, message: successMessage.fetched("Table"), status: 200 });
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const data = await TableService.create(req.venueId!, req.body);
    return responseUtils.success(res, { data, message: successMessage.created("Table"), status: 201 });
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const data = await TableService.update(req.venueId!, req.params.id as string, req.body);
    return responseUtils.success(res, { data, message: successMessage.updated("Table"), status: 200 });
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    await TableService.delete(req.venueId!, req.params.id as string);
    return responseUtils.success(res, { message: successMessage.deleted("Table"), status: 200 });
  });
}
