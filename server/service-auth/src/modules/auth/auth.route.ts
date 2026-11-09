import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validateRequest } from '@scan-and-dine/shared-middlewares';
import { adminLoginSchema, staffPinLoginSchema, refreshTokenSchema } from './auth.validation.js';

const router = Router();

router.post('/admin/login', validateRequest({ body: adminLoginSchema }), AuthController.adminLogin);
router.post('/staff/login', validateRequest({ body: staffPinLoginSchema }), AuthController.staffPinLogin);
router.post('/refresh-token', validateRequest({ body: refreshTokenSchema }), AuthController.refreshToken);
router.post('/logout', AuthController.logout);

export const authRouter = router;
