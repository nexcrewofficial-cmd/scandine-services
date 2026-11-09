import { Router } from 'express';
import express from 'express';
import { WebhookController } from './webhook.controller.js';

const router = Router();

// Stripe requires the raw body for signature verification
router.post('/stripe', express.raw({ type: 'application/json' }), WebhookController.handleStripeWebhook);

export const webhookRouter = router;
