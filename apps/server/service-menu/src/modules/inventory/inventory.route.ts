import { Router } from 'express';
import { InventoryController } from './inventory.controller.js';
import { authenticateJwt, requireVenueId, requireRole } from '@scan-and-dine/shared-middlewares';
import { UserRole } from '@scan-and-dine/shared-types';

const router = Router();

router.use(authenticateJwt);
router.use(requireVenueId);
router.use(requireRole(UserRole.VENUE_ADMIN, UserRole.MANAGER));

router.get('/', InventoryController.list);
router.get('/:id', InventoryController.getById);
router.post('/', InventoryController.create);
router.put('/:id', InventoryController.update);
router.delete('/:id', InventoryController.delete);

export const inventoryRouter = router;
