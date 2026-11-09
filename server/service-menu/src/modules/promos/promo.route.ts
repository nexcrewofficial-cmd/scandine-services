import { Router } from 'express';
import { PromoController } from './promo.controller.js';
import { authenticateJwt, requireVenueId, requireRole } from '@scan-and-dine/shared-middlewares';
import { UserRole } from '@scan-and-dine/shared-types';

const router = Router();

// Validation can be accessed by authenticated customer/waiter
router.post('/validate', requireVenueId, PromoController.validate);

// Admin / Manager routes
router.use(authenticateJwt);
router.use(requireVenueId);
router.use(requireRole(UserRole.VENUE_ADMIN, UserRole.MANAGER));

router.get('/', PromoController.list);
router.post('/', PromoController.create);
router.put('/:id', PromoController.update);
router.delete('/:id', PromoController.delete);

export const promoRouter = router;
