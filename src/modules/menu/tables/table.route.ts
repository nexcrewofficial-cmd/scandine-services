import { Router } from "express";
import { authenticateJwt, requireVenueId, requireRole, validateRequest } from "@scan-and-dine/shared-middlewares";
import { UserRole } from "@scan-and-dine/shared-types";
import { idParamsSchema } from "../../../shared/validation/menu.validation.js";
import { createTableSchema, updateTableSchema } from "./table.validation.js";
import { TableController } from "./table.controller.js";

const router = Router();
router.use(authenticateJwt);
router.use(requireVenueId);
router.use(requireRole(UserRole.VENUE_ADMIN, UserRole.MANAGER));

router.get("/", TableController.list);
router.get("/:id", validateRequest({ params: idParamsSchema }), TableController.getById);
router.post("/", validateRequest({ body: createTableSchema }), TableController.create);
router.put("/:id", validateRequest({ params: idParamsSchema, body: updateTableSchema }), TableController.update);
router.delete("/:id", validateRequest({ params: idParamsSchema }), TableController.delete);

export const tableRouter = router;
