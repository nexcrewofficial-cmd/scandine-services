import { createMenuItemSchema, updateMenuItemSchema, menuItemAvailabilitySchema } from "./menu-item.validation.js";
import { idParamsSchema } from "../../../shared/validation/menu.validation.js";
import { Router } from "express";
import { MenuItemController } from "./menu-item.controller.js";
import { authenticateJwt, requireVenueId, requireRole, validateRequest } from "@scan-and-dine/shared-middlewares";
import { UserRole } from "@scan-and-dine/shared-types";

const router = Router();

// Public route for Customer Web (supports both /:venueSlug and /public/:venueSlug)
router.get("/:venueSlug", MenuItemController.getPublicMenu);
router.get("/public/:venueSlug", MenuItemController.getPublicMenu);

// Protected routes (Admin, Manager, Kitchen)
router.use(authenticateJwt);
router.use(requireVenueId);

router.get("/", MenuItemController.list);
router.get("/:id", MenuItemController.getById);

// 86-ing route: Allow kitchen staff and managers to instantly toggle items (supports both /availability and /stock)
router.patch(
  "/:id/availability",
  requireRole(UserRole.VENUE_ADMIN, UserRole.MANAGER, UserRole.KITCHEN_STAFF),
  validateRequest({ params: idParamsSchema, body: menuItemAvailabilitySchema }),
  MenuItemController.toggleStock
);
router.patch(
  "/:id/stock",
  requireRole(UserRole.VENUE_ADMIN, UserRole.MANAGER, UserRole.KITCHEN_STAFF),
  validateRequest({ params: idParamsSchema, body: menuItemAvailabilitySchema }),
  MenuItemController.toggleStock
);

router.post("/", requireRole(UserRole.VENUE_ADMIN, UserRole.MANAGER), validateRequest({ body: createMenuItemSchema }), MenuItemController.create);
router.put("/:id", requireRole(UserRole.VENUE_ADMIN, UserRole.MANAGER), validateRequest({ params: idParamsSchema, body: updateMenuItemSchema }), MenuItemController.update);
router.delete("/:id", requireRole(UserRole.VENUE_ADMIN, UserRole.MANAGER), validateRequest({ params: idParamsSchema }), MenuItemController.delete);

export const menuItemRouter = router;
