import { Router } from 'express';
import { venueRouter } from './modules/venues/venue.route.js';
import { categoryRouter } from './modules/categories/category.route.js';
import { menuItemRouter } from './modules/menu-items/menu-item.route.js';
import { inventoryRouter } from './modules/inventory/inventory.route.js';
import { promoRouter } from './modules/promos/promo.route.js';
import { printerRouter } from './modules/printers/printer.route.js';

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
