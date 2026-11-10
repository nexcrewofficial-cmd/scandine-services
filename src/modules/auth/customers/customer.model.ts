import mongoose, { Schema, Document } from 'mongoose';
import { ICustomer } from '@scan-and-dine/shared-types';

export interface ICustomerDocument extends Omit<ICustomer, '_id'>, Document {}

const CustomerSchema = new Schema<ICustomerDocument>(
  {
    deviceUUID: { type: String, required: true, unique: true, index: true },
    phoneNumber: { type: String, index: true },
    email: { type: String, lowercase: true, trim: true },
    name: { type: String, trim: true },
    preferredLanguage: { type: String, default: 'en' },
    marketingOptIn: { type: Boolean, default: false },
    loyalty: [
      {
        venueId: { type: Schema.Types.ObjectId, ref: 'Venue', required: true },
        points: { type: Number, default: 0 },
        tier: {
          type: String,
          enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
          default: 'BRONZE',
        },
      },
    ],
    metrics: {
      totalOrders: { type: Number, default: 0 },
      totalSpent: { type: Number, default: 0 },
      averageOrderValue: { type: Number, default: 0 },
      lastVisitDate: { type: Date },
    },
    favoriteItemIds: [{ type: Schema.Types.ObjectId, ref: 'MenuItem' }],
    isBanned: { type: Boolean, default: false },
    banReason: { type: String },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

export const CustomerModel = mongoose.model<ICustomerDocument>('Customer', CustomerSchema);
