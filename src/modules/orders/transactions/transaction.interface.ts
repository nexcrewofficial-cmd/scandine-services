import { TransactionType, TransactionStatus } from './transaction.enum.js';

export * from './transaction.enum.js';

export interface ITransactionBreakdown {
  venueRevenue: number;
  platformFee: number;
  taxCollected: number;
  tipCollected: number;
}

export interface IStripeData {
  chargeId?: string;
  transferId?: string;
  paymentIntentId?: string;
  receiptUrl?: string;
}

export interface ITransaction {
  _id?: string;
  venueId: string;
  orderId: string;
  transactionType: TransactionType;
  amount: number;
  currency: string;
  breakdown: ITransactionBreakdown;
  stripeData?: IStripeData;
  status: TransactionStatus;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}
