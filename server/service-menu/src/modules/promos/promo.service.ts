import { PromoCodeModel, IPromoCodeDocument } from './promo.model.js';
import { AppError } from '@scan-and-dine/shared-middlewares';
import { IPromoCode, PromoStatus } from '@scan-and-dine/shared-types';

export class PromoService {
  static async list(venueId: string): Promise<IPromoCodeDocument[]> {
    return PromoCodeModel.find({ venueId, deletedAt: null }).sort({ createdAt: -1 });
  }

  static async validateAndApply(venueId: string, code: string, orderTotal: number) {
    const promo = await PromoCodeModel.findOne({
      venueId,
      code: code.toUpperCase(),
      status: PromoStatus.ACTIVE,
      deletedAt: null,
    });

    if (!promo) {
      throw AppError.notFound('Invalid or expired coupon code');
    }

    if (promo.validUntil && promo.validUntil < new Date()) {
      throw AppError.badRequest('This coupon code has expired');
    }

    if (promo.criteria.minOrderValue && orderTotal < promo.criteria.minOrderValue) {
      throw AppError.badRequest(
        `Minimum order total of $${promo.criteria.minOrderValue} required for this coupon`
      );
    }

    if (promo.usage.maxTotalUses && promo.usage.currentUses >= promo.usage.maxTotalUses) {
      throw AppError.badRequest('This coupon has reached its maximum redemption limit');
    }

    let discountAmount = 0;
    if (promo.discount.type === 'PERCENTAGE') {
      discountAmount = (orderTotal * promo.discount.value) / 100;
      if (promo.discount.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, promo.discount.maxDiscountAmount);
      }
    } else if (promo.discount.type === 'FLAT') {
      discountAmount = Math.min(promo.discount.value, orderTotal);
    }

    return {
      code: promo.code,
      discountAmount: Math.round(discountAmount * 100) / 100,
      discountType: promo.discount.type,
    };
  }

  static async create(venueId: string, data: Partial<IPromoCode>): Promise<IPromoCodeDocument> {
    const existing = await PromoCodeModel.findOne({ venueId, code: data.code?.toUpperCase() });
    if (existing) {
      throw AppError.conflict('A promo code with this name already exists');
    }
    return PromoCodeModel.create({ ...data, venueId });
  }

  static async update(
    venueId: string,
    id: string,
    updates: Partial<IPromoCode>
  ): Promise<IPromoCodeDocument> {
    const promo = await PromoCodeModel.findOneAndUpdate(
      { _id: id, venueId, deletedAt: null },
      updates,
      { new: true }
    );
    if (!promo) {
      throw AppError.notFound('Promo code not found');
    }
    return promo;
  }

  static async delete(venueId: string, id: string): Promise<void> {
    const promo = await PromoCodeModel.findOneAndUpdate(
      { _id: id, venueId },
      { deletedAt: new Date(), status: PromoStatus.EXPIRED }
    );
    if (!promo) {
      throw AppError.notFound('Promo code not found');
    }
  }
}
