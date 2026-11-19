import { createInventorySchema, updateInventorySchema } from "./inventory.validation.js";
import { idParamsSchema } from "../../../shared/validation/menu.validation.js";
import { Router } from "express";
import { InventoryController } from "./inventory.controller.js";
import { authenticateJwt, requireVenueId, requireRole, validateRequest } from "@scan-and-dine/shared-middlewares";
import { UserRole } from "@scan-and-dine/shared-types";

const router = Router();

router.use(authenticateJwt);
router.use(requireVenueId);
router.use(requireRole(UserRole.VENUE_ADMIN, UserRole.MANAGER));

router.get("/", InventoryController.list);
router.get("/:id", InventoryController.getById);
router.post("/", validateRequest({ body: createInventorySchema }), InventoryController.create);
router.put("/:id", validateRequest({ params: idParamsSchema, body: updateInventorySchema }), InventoryController.update);
router.delete("/:id", validateRequest({ params: idParamsSchema }), InventoryController.delete);

export const inventoryRouter = router;
