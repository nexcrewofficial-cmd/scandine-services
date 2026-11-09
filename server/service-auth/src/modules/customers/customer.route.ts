import { Router } from 'express';
import { CustomerController } from './customer.controller.js';

const router = Router();

router.post('/device', CustomerController.registerDevice);
router.get('/favorites', CustomerController.getFavorites);

export const customerAuthRouter = router;
