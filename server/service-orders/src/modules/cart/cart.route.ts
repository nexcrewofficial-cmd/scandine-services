import { Router } from 'express';
import { CartController } from './cart.controller.js';
import { requireVenueId, requireCustomerDevice } from '@scan-and-dine/shared-middlewares';

const router = Router();

router.use(requireVenueId);
router.use(requireCustomerDevice);

router.get('/', CartController.getCart);
router.post('/items', CartController.addItem);
router.delete('/clear', CartController.clearCart);

export const cartRouter = router;
