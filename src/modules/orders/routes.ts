import { Router } from 'express';
import { orderRouter } from './orders/order.route.js';
import { cartRouter } from './cart/cart.route.js';
import { checkoutRouter } from './checkout/checkout.route.js';
import { kdsRouter } from './kds/kds.route.js';
import { transactionRouter } from './transactions/transaction.route.js';
import { dashboardRouter } from './dashboard/dashboard.route.js';
import { webhookRouter } from './webhooks/webhook.route.js';

const router = Router();

// Sub-routes under /api/v1
router.use('/webhooks', webhookRouter);
router.use('/public/orders', orderRouter);
router.use('/waiter/orders', orderRouter);
router.use('/public/cart', cartRouter);
router.use('/public/checkout', checkoutRouter);
router.use('/kds', kdsRouter);
router.use('/admin/transactions', transactionRouter);
router.use('/admin/dashboard', dashboardRouter);

export const orderRoutes = router;
