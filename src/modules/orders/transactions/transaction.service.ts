import { FilterQuery } from "mongoose";
import { TransactionModel, ITransactionDocument } from "./transaction.model.js";
import { OrderModel } from "../orders/order.model.js";
import { stripe } from "../../../config/stripe.js";
import { AppError, errorMessage } from "../../../shared/constants/messages.constant.js";
import {
  TransactionType,
  TransactionStatus,
  PaymentStatus,
  TransactionQueryFilters,
  PaginatedResult,
} from "@scan-and-dine/shared-types";
import {
  parsePaginationQuery,
  escapeRegex,
  buildPaginationMeta,
} from "../../../shared/utils/query.util.js";

export class TransactionService {
  static async list(
    venueId: string,
    rawQuery: TransactionQueryFilters = {}
  ): Promise<PaginatedResult<ITransactionDocument>> {
    const { page, limit, skip, hasPaging, search, sort } = parsePaginationQuery(rawQuery, {
      createdAt: -1,
    });

    const query: FilterQuery<ITransactionDocument> = { venueId, deletedAt: null };

    if (rawQuery.status && typeof rawQuery.status === "string") {
      query.status = rawQuery.status as TransactionStatus;
    }

    if (rawQuery.transactionType && typeof rawQuery.transactionType === "string") {
      query.transactionType = rawQuery.transactionType as TransactionType;
    }

    if (rawQuery.orderId && typeof rawQuery.orderId === "string") {
      query.orderId = rawQuery.orderId;
    }

    if (rawQuery.startDate || rawQuery.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (rawQuery.startDate) {
        const d = new Date(rawQuery.startDate as string);
        if (!isNaN(d.getTime())) dateFilter.$gte = d;
      }
      if (rawQuery.endDate) {
        const d = new Date(rawQuery.endDate as string);
        if (!isNaN(d.getTime())) dateFilter.$lte = d;
      }
      if (Object.keys(dateFilter).length > 0) {
        query.createdAt = dateFilter;
      }
    }

    if (rawQuery.minAmount !== undefined || rawQuery.maxAmount !== undefined) {
      const amountFilter: Record<string, number> = {};
      if (rawQuery.minAmount !== undefined) {
        const min = Number(rawQuery.minAmount);
        if (!isNaN(min)) amountFilter.$gte = min;
      }
      if (rawQuery.maxAmount !== undefined) {
        const max = Number(rawQuery.maxAmount);
        if (!isNaN(max)) amountFilter.$lte = max;
      }
      if (Object.keys(amountFilter).length > 0) {
        query.amount = amountFilter;
      }
    }

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      query.$or = [{ currency: regex }, { "stripeData.chargeId": regex }, { "stripeData.paymentIntentId": regex }];
    }

    const total = await TransactionModel.countDocuments(query);
    const mQuery = TransactionModel.find(query)
      .populate("orderId", "orderNumber tableNumber orderType financials")
      .sort(sort);

    if (hasPaging) {
      mQuery.skip(skip).limit(limit);
    }

    const data = await mQuery;
    const meta = buildPaginationMeta(total, data.length, page, hasPaging ? limit : total || 1);

    return { data, meta };
  }

  static async refundTransaction(
    venueId: string,
    transactionId: string,
    _reason?: string
  ): Promise<ITransactionDocument> {
    const transaction = await TransactionModel.findOne({ _id: transactionId, venueId });
    if (!transaction) {
      throw AppError.notFound(errorMessage.notFound("Transaction"));
    }

    if (transaction.status === TransactionStatus.FAILED) {
      throw AppError.badRequest(errorMessage.cannotRefundFailed);
    }

    // Process Stripe Refund if online
    if (transaction.stripeData?.paymentIntentId) {
      await stripe.refunds.create({
        payment_intent: transaction.stripeData.paymentIntentId,
        reason: "requested_by_customer",
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
