import { Router } from "express";
import { UserController } from "./user.controller.js";
import {
  authenticateJwt,
  requireRole,
  requireVenueId,
  validateRequest,
} from "@scan-and-dine/shared-middlewares";
import { UserRole } from "@scan-and-dine/shared-types";
import { createStaffSchema, updateStaffSchema } from "./user.validation.js";

const router = Router();

router.use(authenticateJwt);
router.use(requireVenueId);
router.use(requireRole(UserRole.VENUE_ADMIN, UserRole.MANAGER));

router.get("/", UserController.listStaff);
router.get("/:id", UserController.getStaff);
router.post("/", validateRequest({ body: createStaffSchema }), UserController.createStaff);
router.put("/:id", validateRequest({ body: updateStaffSchema }), UserController.updateStaff);
router.delete("/:id", UserController.deleteStaff);

export const userStaffRouter = router;
