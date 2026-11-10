import { Router } from 'express';
import { MenuItemController } from './menu-item.controller.js';
import { authenticateJwt, requireVenueId, requireRole } from '@scan-and-dine/shared-middlewares';
import { UserRole } from '@scan-and-dine/shared-types';

const router = Router();

// Public route for Customer Web
router.get('/public/:venueSlug', MenuItemController.getPublicMenu);

// Protected routes (Admin, Manager, Kitchen)
router.use(authenticateJwt);
router.use(requireVenueId);

router.get('/', MenuItemController.list);
router.get('/:id', MenuItemController.getById);

// 86-ing route: Allow kitchen staff and managers to instantly toggle items
router.patch(
  '/:id/availability',
  requireRole(UserRole.VENUE_ADMIN, UserRole.MANAGER, UserRole.KITCHEN_STAFF),
  MenuItemController.toggleStock
);

router.post('/', requireRole(UserRole.VENUE_ADMIN, UserRole.MANAGER), MenuItemController.create);
router.put('/:id', requireRole(UserRole.VENUE_ADMIN, UserRole.MANAGER), MenuItemController.update);
router.delete('/:id', requireRole(UserRole.VENUE_ADMIN, UserRole.MANAGER), MenuItemController.delete);

export const menuItemRouter = router;
