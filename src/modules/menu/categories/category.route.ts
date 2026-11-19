import { createCategorySchema, updateCategorySchema } from "./category.validation.js";
import { idParamsSchema } from "../../../shared/validation/menu.validation.js";
import { Router } from "express";
import { CategoryController } from "./category.controller.js";
import { authenticateJwt, requireVenueId, requireRole, validateRequest } from "@scan-and-dine/shared-middlewares";
import { UserRole } from "@scan-and-dine/shared-types";

const router = Router();

// Protected admin routes
router.use(authenticateJwt);
router.use(requireVenueId);
router.use(requireRole(UserRole.VENUE_ADMIN, UserRole.MANAGER));

router.get("/", CategoryController.list);
router.post("/", validateRequest({ body: createCategorySchema }), CategoryController.create);
router.put("/:id", validateRequest({ params: idParamsSchema, body: updateCategorySchema }), CategoryController.update);
router.delete("/:id", validateRequest({ params: idParamsSchema }), CategoryController.delete);

export const categoryRouter = router;
