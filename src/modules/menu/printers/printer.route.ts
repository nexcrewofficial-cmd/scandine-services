import { createPrinterSchema, updatePrinterSchema } from "./printer.validation.js";
import { idParamsSchema } from "../../../shared/validation/menu.validation.js";
import { Router } from "express";
import { PrinterController } from "./printer.controller.js";
import { authenticateJwt, requireVenueId, requireRole, validateRequest } from "@scan-and-dine/shared-middlewares";
import { UserRole } from "@scan-and-dine/shared-types";

const router = Router();

router.use(authenticateJwt);
router.use(requireVenueId);
router.use(requireRole(UserRole.VENUE_ADMIN, UserRole.MANAGER));

router.get("/", PrinterController.list);
router.post("/", validateRequest({ body: createPrinterSchema }), PrinterController.create);
router.put("/:id", validateRequest({ params: idParamsSchema, body: updatePrinterSchema }), PrinterController.update);
router.delete("/:id", validateRequest({ params: idParamsSchema }), PrinterController.delete);

export const printerRouter = router;
