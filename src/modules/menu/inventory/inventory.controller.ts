import { Request, Response } from 'express';
import { InventoryService } from './inventory.service.js';
import { asyncHandler, responseUtils, successMessage } from '../../../shared/middlewares/index.js';

export class InventoryController {
  static list = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const data = await InventoryService.list(venueId);
    return responseUtils.success(res, {
      data,
      message: successMessage.dataFetched,
      status: 200,
      meta: { count: data.length },
    });
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const data = await InventoryService.getById(venueId, req.params.id as string);
    return responseUtils.success(res, {
      data,
      message: successMessage.dataFetched,
      status: 200,
    });
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const data = await InventoryService.create(venueId, req.body);
    return responseUtils.success(res, {
      data,
      message: successMessage.created,
      status: 201,
    });
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const data = await InventoryService.update(venueId, req.params.id as string, req.body);
    return responseUtils.success(res, {
      data,
      message: successMessage.updated,
      status: 200,
    });
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    await InventoryService.delete(venueId, req.params.id as string);
    return responseUtils.success(res, {
      message: successMessage.deleted,
      status: 200,
    });
  });
}

