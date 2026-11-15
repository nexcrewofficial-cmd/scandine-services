import { Router } from "express";
import { venueRouter } from "./venues/venue.route.js";
import { categoryRouter } from "./categories/category.route.js";
import { menuItemRouter } from "./menu-items/menu-item.route.js";
import { inventoryRouter } from "./inventory/inventory.route.js";
import { promoRouter } from "./promos/promo.route.js";
import { printerRouter } from "./printers/printer.route.js";

const router = Router();

// Venue Settings (Supports both /admin/settings and /venue/settings)
router.use("/admin/settings", venueRouter);
router.use("/venue/settings", venueRouter);
router.use("/public/venue", venueRouter);

// Menu Categories (Supports both /admin/menu/categories and /categories)
router.use("/admin/menu/categories", categoryRouter);
router.use("/categories", categoryRouter);

// Menu Items (Supports both /admin/menu/items and /menu-items)
router.use("/admin/menu/items", menuItemRouter);
router.use("/menu-items", menuItemRouter);
router.use("/public/menu", menuItemRouter);

// Inventory (Supports both /admin/inventory and /inventory)
router.use("/admin/inventory", inventoryRouter);
router.use("/inventory", inventoryRouter);

// Promotions (Supports both /admin/promos and /promos)
router.use("/admin/promos", promoRouter);
router.use("/promos", promoRouter);

// Thermal Hardware Printers
router.use("/admin/printers", printerRouter);
router.use("/printers", printerRouter);

export const menuRoutes = router;
