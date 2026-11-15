import { Router } from "express";
import { orderRouter } from "./orders/order.route.js";
import { cartRouter } from "./cart/cart.route.js";
import { checkoutRouter } from "./checkout/checkout.route.js";
import { kdsRouter } from "./kds/kds.route.js";
import { transactionRouter } from "./transactions/transaction.route.js";
import { dashboardRouter } from "./dashboard/dashboard.route.js";
import { webhookRouter } from "./webhooks/webhook.route.js";
import { waiterRouter } from "./waiter/waiter.route.js";

const router = Router();

// Sub-routes under /api/v1
router.use("/webhooks", webhookRouter);

// Orders (Supports both /public/orders and /orders)
router.use("/public/orders", orderRouter);
router.use("/orders", orderRouter);

// Waiter App
router.use("/waiter", waiterRouter);

// Cart (Supports both /public/cart and /cart)
router.use("/public/cart", cartRouter);
router.use("/cart", cartRouter);

// Checkout (Supports both /public/checkout and /checkout)
router.use("/public/checkout", checkoutRouter);
router.use("/checkout", checkoutRouter);

// KDS Kitchen Screens
router.use("/kds", kdsRouter);

// Financial Transactions (Supports both /admin/transactions and /transactions)
router.use("/admin/transactions", transactionRouter);
router.use("/transactions", transactionRouter);

// Dashboard (Supports both /admin/dashboard and /dashboard)
router.use("/admin/dashboard", dashboardRouter);
router.use("/dashboard", dashboardRouter);

export const orderRoutes = router;
