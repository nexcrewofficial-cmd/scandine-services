import { Router } from 'express';
import { WaiterController } from './waiter.controller.js';
import {
  authenticateJwt,
  requireVenueId,
  requireRole,
  validateBody,
} from '../../../shared/middlewares/index.js';
import { UserRole } from '../../auth/users/user.enum.js';
import {
  manualOrderSchema,
  voidOrderSchema,
  collectCashSchema,
  remoteBillPrintSchema,
} from './waiter.validation.js';

const router = Router();

router.use(authenticateJwt);
router.use(requireVenueId);
router.use(requireRole(UserRole.WAITER, UserRole.MANAGER, UserRole.VENUE_ADMIN));

// Live floor map & menu
router.get('/tables', WaiterController.getFloorMap);
router.get('/menu', WaiterController.getMenu);

// Order punch & service
router.post('/orders', validateBody(manualOrderSchema), WaiterController.punchOrder);
router.patch('/orders/:id/serve', WaiterController.serveOrder);

// Void & Cash collection controls
router.post('/orders/:id/void', validateBody(voidOrderSchema), WaiterController.voidOrder);
router.get('/pay-later', WaiterController.getPayLaterQueue);
router.post(
  '/orders/:id/collect-cash',
  validateBody(collectCashSchema),
  WaiterController.collectCash
);

// Remote Bill Printing
router.post(
  '/orders/:id/print',
  validateBody(remoteBillPrintSchema),
  WaiterController.printBill
);

export const waiterRouter = router;
