import { DiscountType, PromoStatus } from './promo.enum.js';

export * from './promo.enum.js';

export interface IPromoDiscount {
  type: DiscountType;
  value: number;
  maxDiscountAmount?: number;
}

export interface IPromoCriteria {
  minOrderValue?: number;
  validDays?: ('MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN')[];
  startTime?: string;
  endTime?: string;
  applicableItemIds?: string[];
  applicableCategoryIds?: string[];
}

export interface IPromoUsage {
  currentUses: number;
  maxTotalUses?: number;
  maxUsesPerCustomer?: number;
}

export interface IPromoCode {
  _id?: string;
  venueId: string;
  code: string;
  campaignName: string;
  discount: IPromoDiscount;
  criteria: IPromoCriteria;
  usage: IPromoUsage;
  status: PromoStatus;
  validFrom?: Date;
  validUntil?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}
