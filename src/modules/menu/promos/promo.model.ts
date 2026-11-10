import mongoose, { Schema, Document } from 'mongoose';
import { IPromoCode, DiscountType, PromoStatus } from '@scan-and-dine/shared-types';

export interface IPromoCodeDocument extends Omit<IPromoCode, '_id'>, Document {}

const PromoCodeSchema = new Schema<IPromoCodeDocument>(
  {
    venueId: { type: Schema.Types.ObjectId as any, ref: 'Venue', required: true, index: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    campaignName: { type: String, required: true },
    discount: {
      type: {
        type: String,
        enum: Object.values(DiscountType),
        required: true,
      },
      value: { type: Number, required: true, min: 0 },
      maxDiscountAmount: { type: Number },
    },
    criteria: {
      minOrderValue: { type: Number, default: 0 },
      validDays: [{ type: String, enum: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] }],
      startTime: { type: String },
      endTime: { type: String },
      applicableItemIds: [{ type: Schema.Types.ObjectId as any, ref: 'MenuItem' }],
      applicableCategoryIds: [{ type: Schema.Types.ObjectId as any, ref: 'Category' }],
    },
    usage: {
      currentUses: { type: Number, default: 0 },
      maxTotalUses: { type: Number },
      maxUsesPerCustomer: { type: Number, default: 1 },
    },
    status: {
      type: String,
      enum: Object.values(PromoStatus),
      default: PromoStatus.ACTIVE,
      index: true,
    },
    validFrom: { type: Date },
    validUntil: { type: Date },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

PromoCodeSchema.index({ venueId: 1, code: 1 }, { unique: true });

export const PromoCodeModel = mongoose.model<IPromoCodeDocument>('PromoCode', PromoCodeSchema);
