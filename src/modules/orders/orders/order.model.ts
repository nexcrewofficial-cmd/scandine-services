import mongoose, { Schema, Document } from 'mongoose';
import {
  IOrder,
  OrderStatus,
  OrderType,
  PaymentStatus,
  PaymentMethod,
  KdsItemStatus,
} from '@scan-and-dine/shared-types';

export interface IOrderDocument extends Omit<IOrder, '_id'>, Document {}

const OrderSchema = new Schema<IOrderDocument>(
  {
    venueId: { type: Schema.Types.ObjectId as any, ref: 'Venue', required: true, index: true },
    customerUUID: { type: String, index: true },
    orderNumber: { type: String, required: true }, // e.g. "A-104" or "#402"
    tableNumber: { type: String, index: true },
    orderType: {
      type: String,
      enum: Object.values(OrderType),
      default: OrderType.DINE_IN,
    },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING_PAYMENT,
      index: true,
    },
    items: [
      {
        menuItemId: { type: Schema.Types.ObjectId as any, ref: 'MenuItem', required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true },
        modifiersSelected: [
          {
            groupName: { type: String, required: true },
            optionName: { type: String, required: true },
            extraPrice: { type: Number, default: 0 },
          },
        ],
        itemTotal: { type: Number, required: true },
        kdsStatus: {
          type: String,
          enum: Object.values(KdsItemStatus),
          default: KdsItemStatus.PENDING,
        },
        stationTag: { type: String, default: 'MAIN_KITCHEN' },
        specialInstructions: { type: String },
      },
    ],
    financials: {
      subtotal: { type: Number, required: true, default: 0 },
      totalTax: { type: Number, required: true, default: 0 },
      discountTotal: { type: Number, default: 0 },
      tipAmount: { type: Number, default: 0 },
      platformFee: { type: Number, default: 0 },
      grandTotal: { type: Number, required: true, default: 0 },
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.UNPAID,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
    },
    stripeIdempotencyKey: { type: String, index: true },
    stripePaymentIntentId: { type: String, index: true },
    timing: {
      placedAt: { type: Date, default: Date.now },
      acceptedAt: { type: Date },
      preparedAt: { type: Date },
      servedAt: { type: Date },
      completedAt: { type: Date },
    },
    notes: { type: String },
    serverStaffId: { type: Schema.Types.ObjectId as any, ref: 'User' },
    voidReason: { type: String },
    voidApprovedBy: { type: Schema.Types.ObjectId as any, ref: 'User' },
    // Optimistic Concurrency Control
    version: { type: Number, required: true, default: 0 },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// High-speed index for Friday Night Rush
OrderSchema.index({ venueId: 1, status: 1 });
OrderSchema.index({ venueId: 1, createdAt: -1 });

export const OrderModel = mongoose.model<IOrderDocument>('Order', OrderSchema);
