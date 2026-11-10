import Stripe from 'stripe';
import { config } from './env.js';

export const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2024-11-20.acacia' as any,
  typescript: true,
});
