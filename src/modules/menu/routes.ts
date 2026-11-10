import { Router } from 'express';
import { venueRouter } from './venues/venue.route.js';
import { categoryRouter } from './categories/category.route.js';
import { menuItemRouter } from './menu-items/menu-item.route.js';
import { inventoryRouter } from './inventory/inventory.route.js';
import { promoRouter } from './promos/promo.route.js';
import { printerRouter } from './printers/printer.route.js';

const router = Router();

// Sub-routes under /api/v1
router.use('/admin/settings', venueRouter);
router.use('/admin/menu/categories', categoryRouter);
router.use('/admin/menu/items', menuItemRouter);
router.use('/public/menu', menuItemRouter);
router.use('/admin/inventory', inventoryRouter);
router.use('/admin/promos', promoRouter);
router.use('/admin/printers', printerRouter);

export const menuRoutes = router;
