import { Router } from 'express';
import { authRouter } from './auth/auth.route.js';
import { userStaffRouter } from './users/user.route.js';
import { customerAuthRouter } from './customers/customer.route.js';
import { shiftRouter } from './shifts/shift.route.js';

const router = Router();

// Sub-routes under /api/v1
router.use('/auth', authRouter);
router.use('/admin/staff', userStaffRouter);
router.use('/public/auth', customerAuthRouter);
router.use('/staff', shiftRouter);
router.use('/admin/payroll', shiftRouter);

export const authRoutes = router;
