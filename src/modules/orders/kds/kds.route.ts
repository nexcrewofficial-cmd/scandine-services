import { Router } from "express";
import { KDSController } from "./kds.controller.js";
import {
  authenticateJwt,
  requireVenueId,
  requireRole,
  validateBody,
} from "../../../shared/middlewares/index.js";
import { UserRole } from "../../../modules/auth/users/user.enum.js";
import {
  updateTicketStatusSchema,
  updateItemStatusSchema,
  toggleAvailabilitySchema,
} from "./kds.validation.js";

const router = Router();

router.use(authenticateJwt);
router.use(requireVenueId);
router.use(
  requireRole(UserRole.KITCHEN_STAFF, UserRole.VENUE_ADMIN, UserRole.MANAGER),
);

// Ticket operations
router.get("/tickets", KDSController.getTickets);
router.patch(
  "/tickets/:id/status",
  validateBody(updateTicketStatusSchema),
  KDSController.updateStatus,
);
router.patch(
  "/tickets/:id/items/:itemIndex/status",
  validateBody(updateItemStatusSchema),
  KDSController.updateItemStatus,
);
router.post("/tickets/:id/undo", KDSController.undoStatus);
router.post("/tickets/:id/print", KDSController.printKOT);

// Stock availability controls from Kitchen
router.get("/item-availability", KDSController.getItemAvailability);
router.patch(
  "/item-availability/:id",
  validateBody(toggleAvailabilitySchema),
  KDSController.toggleItemAvailability,
);

export const kdsRouter = router;

