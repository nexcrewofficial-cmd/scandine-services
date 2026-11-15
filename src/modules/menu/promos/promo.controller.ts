import { Request, Response } from "express";
import { PromoService } from "./promo.service.js";
import { asyncHandler, responseUtils, successMessage } from "../../../shared/middlewares/index.js";

export class PromoController {
  static list = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const { data, meta } = await PromoService.list(venueId, req.query);
    return responseUtils.list(res, {
      key: "promos",
      extraKeys: ["promo"],
      data,
      meta,
    });
  });

  static validate = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const { code, orderTotal } = req.body;
    const data = await PromoService.validateAndApply(venueId, code, Number(orderTotal) || 0);
    return responseUtils.success(res, {
      data,
      message: successMessage.operationSuccess,
      status: 200,
    });
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const data = await PromoService.create(venueId, req.body);
    return responseUtils.success(res, {
      data,
      message: successMessage.created,
      status: 201,
    });
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const data = await PromoService.update(venueId, req.params.id as string, req.body);
    return responseUtils.success(res, {
      data,
      message: successMessage.updated,
      status: 200,
    });
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    await PromoService.delete(venueId, req.params.id as string);
    return responseUtils.success(res, {
      message: successMessage.deleted,
      status: 200,
    });
  });
}
