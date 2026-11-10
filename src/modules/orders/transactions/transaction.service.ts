import { TransactionModel, ITransactionDocument } from './transaction.model.js';
import { OrderModel } from '../orders/order.model.js';
import { stripe } from '../../../config/stripe.js';
import { AppError } from '@scan-and-dine/shared-middlewares';
import { TransactionType, TransactionStatus, PaymentStatus } from '@scan-and-dine/shared-types';

export class TransactionService {
  static async list(venueId: string): Promise<ITransactionDocument[]> {
    return TransactionModel.find({ venueId, deletedAt: null })
      .populate('orderId', 'orderNumber tableNumber orderType financials')
      .sort({ createdAt: -1 });
  }

  static async refundTransaction(
    venueId: string,
    transactionId: string,
    reason?: string
  ): Promise<ITransactionDocument> {
    const transaction = await TransactionModel.findOne({ _id: transactionId, venueId });
    if (!transaction) {
      throw AppError.notFound('Transaction not found');
    }

    if (transaction.status === TransactionStatus.FAILED) {
      throw AppError.badRequest('Cannot refund a failed transaction');
    }

    // Process Stripe Refund if online
    if (transaction.stripeData?.paymentIntentId) {
      await stripe.refunds.create({
        payment_intent: transaction.stripeData.paymentIntentId,
        reason: 'requested_by_customer',
      });
    }

    // Create Refund Ledger Entry
    const refundRecord = await TransactionModel.create({
      venueId,
      orderId: transaction.orderId,
      transactionType: TransactionType.REFUND,
      amount: -transaction.amount,
      currency: transaction.currency,
      breakdown: {
        venueRevenue: -transaction.breakdown.venueRevenue,
        platformFee: -transaction.breakdown.platformFee,
        taxCollected: -transaction.breakdown.taxCollected,
        tipCollected: -transaction.breakdown.tipCollected,
      },
      status: TransactionStatus.SETTLED,
    });

    // Update original order status
    await OrderModel.findByIdAndUpdate(transaction.orderId, {
      paymentStatus: PaymentStatus.REFUNDED,
    });

    return refundRecord;
  }
}
