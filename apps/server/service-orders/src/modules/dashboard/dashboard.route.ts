import { Router } from 'express';
import { DashboardController } from './dashboard.controller.js';
import { authenticateJwt, requireVenueId, requireRole } from '@scan-and-dine/shared-middlewares';
import { UserRole } from '@scan-and-dine/shared-types';

const router = Router();

router.use(authenticateJwt);
router.use(requireVenueId);
router.use(requireRole(UserRole.VENUE_ADMIN, UserRole.MANAGER));

router.get('/', DashboardController.getOverview);

export const dashboardRouter = router;
