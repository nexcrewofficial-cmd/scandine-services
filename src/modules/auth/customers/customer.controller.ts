import { Request, Response } from 'express';
import { CustomerService } from './customer.service.js';
import { asyncHandler, responseUtils, successMessage } from '../../../shared/middlewares/index.js';

export class CustomerController {
  static registerDevice = asyncHandler(async (req: Request, res: Response) => {
    const data = await CustomerService.registerOrGetDevice(req.body);
    return responseUtils.success(res, {
      data,
      message: successMessage.operationSuccess,
      status: 200,
    });
  });

  static getFavorites = asyncHandler(async (req: Request, res: Response) => {
    const deviceUUID = req.headers['x-device-uuid'] as string;
    const data = await CustomerService.getFavorites(deviceUUID);
    return responseUtils.success(res, {
      data,
      message: successMessage.dataFetched,
      status: 200,
    });
  });
}

