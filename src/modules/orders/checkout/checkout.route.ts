import { Router } from "express";
import { CheckoutController } from "./checkout.controller.js";
import { requireVenueId, requireCustomerDevice } from "@scan-and-dine/shared-middlewares";

const router = Router();

router.use(requireVenueId);
router.use(requireCustomerDevice);

router.post("/initiate", CheckoutController.initiateStripe);
router.post("/stripe", CheckoutController.initiateStripe);
router.post("/cash", CheckoutController.checkoutCash);

export const checkoutRouter = router;
