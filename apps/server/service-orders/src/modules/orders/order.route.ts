import { Router } from 'express';
import { OrderController } from './order.controller.js';
import { authenticateJwt, requireVenueId, requireRole, optionalJwt } from '@scan-and-dine/shared-middlewares';
import { UserRole } from '@scan-and-dine/shared-types';

const router = Router();

// Call Waiter button from Customer App
router.post('/call-waiter', requireVenueId, OrderController.callWaiter);

// Customer or Waiter creating order
router.post('/', requireVenueId, optionalJwt, OrderController.createOrder);
router.get('/:id', requireVenueId, OrderController.getOrder);

// Protected Staff routes
router.use(authenticateJwt);
router.use(requireVenueId);

router.get('/', OrderController.listOrders);
router.patch(
  '/:id/status',
  requireRole(UserRole.VENUE_ADMIN, UserRole.MANAGER, UserRole.WAITER, UserRole.KITCHEN_STAFF),
  OrderController.updateStatus
);

export const orderRouter = router;
