import { createPromoSchema, updatePromoSchema } from "./promo.validation.js";
import { idParamsSchema } from "../../../shared/validation/menu.validation.js";
import { Router } from "express";
import { PromoController } from "./promo.controller.js";
import { authenticateJwt, requireVenueId, requireRole, validateRequest } from "@scan-and-dine/shared-middlewares";
import { UserRole } from "@scan-and-dine/shared-types";

const router = Router();

// Validation can be accessed by authenticated customer/waiter
router.post("/validate", requireVenueId, PromoController.validate);

// Admin / Manager routes
router.use(authenticateJwt);
router.use(requireVenueId);
router.use(requireRole(UserRole.VENUE_ADMIN, UserRole.MANAGER));

router.get("/", PromoController.list);
router.post("/", validateRequest({ body: createPromoSchema }), PromoController.create);
router.put("/:id", validateRequest({ params: idParamsSchema, body: updatePromoSchema }), PromoController.update);
router.delete("/:id", validateRequest({ params: idParamsSchema }), PromoController.delete);

export const promoRouter = router;
