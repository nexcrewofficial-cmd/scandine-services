import { Request, Response } from 'express';
import { stripe } from '../../config/stripe.js';
import { config } from '../../config/env.js';
import { OrderModel } from '../orders/order.model.js';
import { TransactionModel } from '../transactions/transaction.model.js';
import { OrderStatus, PaymentStatus, TransactionType, TransactionStatus } from '@scan-and-dine/shared-types';
import { publishEvent, EventChannels } from '@scan-and-dine/event-bus';
import { logger } from '@scan-and-dine/logger';

export class WebhookController {
  static async handleStripeWebhook(req: Request, res: Response): Promise<void> {
    const sig = req.headers['stripe-signature'] as string;
    let event;

    try {
      if (config.stripeWebhookSecret && sig) {
        event = stripe.webhooks.constructEvent(req.body, sig, config.stripeWebhookSecret);
      } else {
        event = req.body;
      }
    } catch (err: any) {
      logger.error({ err }, 'Stripe webhook signature verification failed');
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      logger.info({ id: paymentIntent.id }, 'PaymentIntent succeeded');

      const order = await OrderModel.findOne({ stripePaymentIntentId: paymentIntent.id });
      if (order) {
        order.paymentStatus = PaymentStatus.PAID;
        order.status = OrderStatus.SENT_TO_KITCHEN;
        order.timing.acceptedAt = new Date();
        await order.save();

        // Create transaction ledger record
        await TransactionModel.create({
          venueId: order.venueId,
          orderId: order._id,
          transactionType: TransactionType.CHARGE,
          amount: order.financials.grandTotal,
          breakdown: {
            venueRevenue: order.financials.subtotal,
            platformFee: order.financials.platformFee,
            taxCollected: order.financials.totalTax,
            tipCollected: order.financials.tipAmount,
          },
          stripeData: {
            paymentIntentId: paymentIntent.id,
          },
          status: TransactionStatus.SETTLED,
        });

        // Broadcast order to KDS and Waiter via Redis bus
        await publishEvent(EventChannels.ORDER_CREATED, {
          venueId: order.venueId.toString(),
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          tableNumber: order.tableNumber,
          status: order.status,
        });
      }
    }

    res.status(200).json({ received: true });
  }
}
