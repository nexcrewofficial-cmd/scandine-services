import { OperatingMode, SubscriptionTier, SubscriptionStatus } from '../enums/venue.enum.js';

export interface IVenueAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface IVenueCoordinates {
  type: 'Point';
  coordinates: [number, number]; // [Longitude, Latitude]
}

export interface IBusinessHours {
  day: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface IFeatureFlags {
  hasScanToOrder: boolean;
  hasWaiterApp: boolean;
  hasKDS: boolean;
  hasPOSIntegration: boolean;
}

export interface IVenueSettings {
  taxRate: number;
  currency: string;
  autoAcceptOrders: boolean;
  allowCashPayments: boolean;
  geofenceRadiusMeters?: number;
}

export interface IVenue {
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  address?: IVenueAddress;
  coordinates?: IVenueCoordinates;
  contactPhone?: string;
  contactEmail?: string;
  websiteUrl?: string;
  timezone: string;
  businessHours?: IBusinessHours[];
  operatingMode: OperatingMode;
  featureFlags: IFeatureFlags;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  stripeAccountId?: string;
  settings: IVenueSettings;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}
