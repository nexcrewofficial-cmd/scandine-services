import { Router } from 'express';
import { TransactionController } from './transaction.controller.js';
import { authenticateJwt, requireVenueId, requireRole } from '@scan-and-dine/shared-middlewares';
import { UserRole } from '@scan-and-dine/shared-types';

const router = Router();

router.use(authenticateJwt);
router.use(requireVenueId);
router.use(requireRole(UserRole.VENUE_ADMIN, UserRole.MANAGER));

router.get('/', TransactionController.list);
router.post('/:id/refund', TransactionController.refund);

export const transactionRouter = router;
