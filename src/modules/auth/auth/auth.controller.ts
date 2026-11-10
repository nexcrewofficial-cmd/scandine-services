import { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { asyncHandler, responseUtils, successMessage } from '../../../shared/middlewares/index.js';

export class AuthController {
  static adminLogin = asyncHandler(async (req: Request, res: Response) => {
    const data = await AuthService.adminLogin(req.body);
    return responseUtils.success(res, {
      data,
      message: successMessage.loginSuccess,
      status: 200,
    });
  });

  static staffPinLogin = asyncHandler(async (req: Request, res: Response) => {
    const data = await AuthService.staffPinLogin(req.body);
    return responseUtils.success(res, {
      data,
      message: successMessage.loginSuccess,
      status: 200,
    });
  });

  static refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const data = await AuthService.refresh(req.body.refreshToken);
    return responseUtils.success(res, {
      data,
      message: successMessage.operationSuccess,
      status: 200,
    });
  });

  static logout = asyncHandler(async (_req: Request, res: Response) => {
    return responseUtils.success(res, {
      message: successMessage.logoutSuccess,
      status: 200,
    });
  });
}

