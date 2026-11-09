import mongoose, { Schema, Document } from 'mongoose';
import {
  ITransaction,
  TransactionType,
  TransactionStatus,
} from '@scan-and-dine/shared-types';

export interface ITransactionDocument extends Omit<ITransaction, '_id'>, Document {}

const TransactionSchema = new Schema<ITransactionDocument>(
  {
    venueId: { type: Schema.Types.ObjectId as any, ref: 'Venue', required: true, index: true },
    orderId: { type: Schema.Types.ObjectId as any, ref: 'Order', required: true, index: true },
    transactionType: {
      type: String,
      enum: Object.values(TransactionType),
      default: TransactionType.CHARGE,
      index: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    breakdown: {
      venueRevenue: { type: Number, required: true },
      platformFee: { type: Number, required: true },
      taxCollected: { type: Number, required: true },
      tipCollected: { type: Number, default: 0 },
    },
    stripeData: {
      chargeId: { type: String },
      transferId: { type: String },
      paymentIntentId: { type: String },
      receiptUrl: { type: String },
    },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.SETTLED,
      index: true,
    },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

TransactionSchema.index({ venueId: 1, createdAt: -1 });

export const TransactionModel = mongoose.model<ITransactionDocument>(
  'Transaction',
  TransactionSchema
);
