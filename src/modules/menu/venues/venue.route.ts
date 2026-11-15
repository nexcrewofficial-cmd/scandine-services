import { Router } from "express";
import { VenueController } from "./venue.controller.js";
import { authenticateJwt, requireVenueId, requireRole } from "@scan-and-dine/shared-middlewares";
import { UserRole } from "@scan-and-dine/shared-types";

const router = Router();

// Public route for customer web (supports both /:venueSlug and /public/:venueSlug)
router.get("/:venueSlug", VenueController.getPublicVenue);
router.get("/public/:venueSlug", VenueController.getPublicVenue);

// Protected admin routes
router.use(authenticateJwt);
router.use(requireVenueId);
router.use(requireRole(UserRole.VENUE_ADMIN, UserRole.MANAGER));

router.get("/", VenueController.getSettings);
router.put("/", VenueController.updateSettings);
router.patch("/", VenueController.updateSettings);

export const venueRouter = router;
