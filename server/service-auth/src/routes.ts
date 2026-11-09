import { Router } from 'express';
import { authRouter } from './modules/auth/auth.route.js';
import { userStaffRouter } from './modules/users/user.route.js';
import { customerAuthRouter } from './modules/customers/customer.route.js';
import { shiftRouter } from './modules/shifts/shift.route.js';

const router = Router();

// Sub-routes under /api/v1
router.use('/auth', authRouter);
router.use('/admin/staff', userStaffRouter);
router.use('/public/auth', customerAuthRouter);
router.use('/staff', shiftRouter);
router.use('/admin/payroll', shiftRouter);

export const authRoutes = router;
