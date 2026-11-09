import { Router } from 'express';
import { KDSController } from './kds.controller.js';
import { authenticateJwt, requireVenueId, requireRole } from '@scan-and-dine/shared-middlewares';
import { UserRole } from '@scan-and-dine/shared-types';

const router = Router();

router.use(authenticateJwt);
router.use(requireVenueId);
router.use(requireRole(UserRole.KITCHEN_STAFF, UserRole.VENUE_ADMIN, UserRole.MANAGER));

router.get('/tickets', KDSController.getTickets);
router.patch('/tickets/:id/status', KDSController.updateStatus);

export const kdsRouter = router;
