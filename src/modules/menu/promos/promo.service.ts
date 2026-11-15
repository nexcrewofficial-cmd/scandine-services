import { FilterQuery } from "mongoose";
import { PromoCodeModel, IPromoCodeDocument } from "./promo.model.js";
import { AppError, errorMessage } from "../../../shared/constants/messages.constant.js";
import { IPromoCode, PromoStatus, DiscountType, PromoQueryFilters, PaginatedResult } from "@scan-and-dine/shared-types";
import {
  parsePaginationQuery,
  escapeRegex,
  buildPaginationMeta,
} from "../../../shared/utils/query.util.js";

export class PromoService {
  static async list(
    venueId: string,
    rawQuery: PromoQueryFilters = {}
  ): Promise<PaginatedResult<IPromoCodeDocument>> {
    const { page, limit, skip, hasPaging, search, sort } = parsePaginationQuery(rawQuery, {
      createdAt: -1,
    });

    const query: FilterQuery<IPromoCodeDocument> = { venueId, deletedAt: null };

    if (rawQuery.status && typeof rawQuery.status === "string") {
      query.status = rawQuery.status as PromoStatus;
    }

    if (rawQuery.discountType && typeof rawQuery.discountType === "string") {
      query["discount.type"] = rawQuery.discountType as DiscountType;
    }

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      query.$or = [{ code: regex }, { campaignName: regex }];
    }

    const total = await PromoCodeModel.countDocuments(query);
    const mQuery = PromoCodeModel.find(query).sort(sort);

    if (hasPaging) {
      mQuery.skip(skip).limit(limit);
    }

    const data = await mQuery;
    const meta = buildPaginationMeta(total, data.length, page, hasPaging ? limit : total || 1);

    return { data, meta };
  }

  static async validateAndApply(venueId: string, code: string, orderTotal: number) {
    const promo = await PromoCodeModel.findOne({
      venueId,
      code: code.toUpperCase(),
      status: PromoStatus.ACTIVE,
      deletedAt: null,
    });

    if (!promo) {
      throw AppError.notFound(errorMessage.invalidCoupon);
    }

    if (promo.validUntil && promo.validUntil < new Date()) {
      throw AppError.badRequest(errorMessage.couponExpired);
    }

    if (promo.criteria.minOrderValue && orderTotal < promo.criteria.minOrderValue) {
      throw AppError.badRequest(
        errorMessage.minOrderValueRequired(promo.criteria.minOrderValue)
      );
    }

    if (promo.usage.maxTotalUses && promo.usage.currentUses >= promo.usage.maxTotalUses) {
      throw AppError.badRequest(errorMessage.couponLimitReached);
    }

    let discountAmount = 0;
    if (promo.discount.type === "PERCENTAGE") {
      discountAmount = (orderTotal * promo.discount.value) / 100;
      if (promo.discount.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, promo.discount.maxDiscountAmount);
      }
    } else if (promo.discount.type === "FLAT") {
      discountAmount = Math.min(promo.discount.value, orderTotal);
    }

    return {
      code: promo.code,
      discountAmount: Math.round(discountAmount * 100) / 100,
      discountType: promo.discount.type,
    };
  }

  static async create(venueId: string, data: Partial<IPromoCode>): Promise<IPromoCodeDocument> {
    const existing = await PromoCodeModel.findOne({
      venueId,
      code: data.code?.toUpperCase(),
    });
    if (existing) {
      throw AppError.conflict(errorMessage.alreadyExists("Promo code"));
    }
    return PromoCodeModel.create({
      ...data,
      venueId,
      code: data.code?.toUpperCase(),
    });
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
      throw AppError.notFound(errorMessage.notFound("Promo code"));
    }
    return promo;
  }

  static async delete(venueId: string, id: string): Promise<void> {
    const promo = await PromoCodeModel.findOneAndUpdate(
      { _id: id, venueId },
      { deletedAt: new Date() }
    );
    if (!promo) {
      throw AppError.notFound(errorMessage.notFound("Promo code"));
    }
  }
}
