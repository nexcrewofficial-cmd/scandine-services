import { Request, Response } from 'express';
import { MenuItemService } from './menu-item.service.js';
import { asyncHandler, responseUtils, successMessage } from '../../../shared/middlewares/index.js';

export class MenuItemController {
  static getPublicMenu = asyncHandler(async (req: Request, res: Response) => {
    const data = await MenuItemService.getPublicCatalog(req.params.venueSlug as string);
    return responseUtils.success(res, {
      data,
      message: successMessage.dataFetched,
      status: 200,
    });
  });

  static list = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const data = await MenuItemService.listItems(venueId);
    return responseUtils.success(res, {
      data,
      message: successMessage.dataFetched,
      status: 200,
      meta: { count: data.length },
    });
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const data = await MenuItemService.getItemById(venueId, req.params.id as string);
    return responseUtils.success(res, {
      data,
      message: successMessage.dataFetched,
      status: 200,
    });
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const data = await MenuItemService.createItem(venueId, req.body);
    return responseUtils.success(res, {
      data,
      message: successMessage.created,
      status: 201,
    });
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const data = await MenuItemService.updateItem(venueId, req.params.id as string, req.body);
    return responseUtils.success(res, {
      data,
      message: successMessage.updated,
      status: 200,
    });
  });

  // 86-ing Toggle (Kitchen / Admin)
  static toggleStock = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    const data = await MenuItemService.toggleAvailability(
      venueId,
      req.params.id as string,
      req.body.isAvailable
    );
    return responseUtils.success(res, {
      data,
      message: data.isAvailable ? 'Item marked in-stock' : 'Item 86-ed (out of stock)',
      status: 200,
    });
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const venueId = req.venueId!;
    await MenuItemService.deleteItem(venueId, req.params.id as string);
    return responseUtils.success(res, {
      message: successMessage.deleted,
      status: 200,
    });
  });
}

