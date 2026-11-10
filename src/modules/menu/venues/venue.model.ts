import mongoose, { Schema, Document } from 'mongoose';
import {
  IVenue,
  OperatingMode,
  SubscriptionTier,
  SubscriptionStatus,
} from '@scan-and-dine/shared-types';

export interface IVenueDocument extends Omit<IVenue, '_id'>, Document {}

const VenueSchema = new Schema<IVenueDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String },
    logoUrl: { type: String },
    bannerUrl: { type: String },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
      country: { type: String },
    },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [Long, Lat]
    },
    contactPhone: { type: String },
    contactEmail: { type: String },
    websiteUrl: { type: String },
    timezone: { type: String, default: 'Asia/Kolkata' },
    businessHours: [
      {
        day: { type: String, enum: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] },
        openTime: { type: String },
        closeTime: { type: String },
        isClosed: { type: Boolean, default: false },
      },
    ],
    operatingMode: {
      type: String,
      enum: Object.values(OperatingMode),
      default: OperatingMode.DINE_IN,
    },
    featureFlags: {
      hasScanToOrder: { type: Boolean, default: true },
      hasWaiterApp: { type: Boolean, default: true },
      hasKDS: { type: Boolean, default: true },
      hasPOSIntegration: { type: Boolean, default: false },
    },
    subscriptionTier: {
      type: String,
      enum: Object.values(SubscriptionTier),
      default: SubscriptionTier.BASIC,
    },
    subscriptionStatus: {
      type: String,
      enum: Object.values(SubscriptionStatus),
      default: SubscriptionStatus.TRIAL,
    },
    stripeAccountId: { type: String },
    settings: {
      taxRate: { type: Number, default: 5 }, // Default 5%
      currency: { type: String, default: 'USD' },
      autoAcceptOrders: { type: Boolean, default: true },
      allowCashPayments: { type: Boolean, default: true },
      geofenceRadiusMeters: { type: Number, default: 200 },
    },
    isActive: { type: Boolean, default: true, index: true },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

VenueSchema.index({ 'coordinates': '2dsphere' });

export const VenueModel = mongoose.model<IVenueDocument>('Venue', VenueSchema);
