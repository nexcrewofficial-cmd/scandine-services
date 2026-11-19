import { z } from "zod";
import { DiscountType, PromoStatus } from "./promo.enum.js";
import {
  nameSchema,
  amountSchema,
  objectIdSchema,
  daysSchema,
  timeSchema,
  dateSchema,
} from "../../../shared/validation/menu.validation.js";
import { errorMessage } from "../../../shared/constants/messages.constant.js";

export const createPromoSchema = z
  .object({
    code: nameSchema.toUpperCase(),
    campaignName: nameSchema,
    discount: z
      .object({
        type: z.nativeEnum(DiscountType),
        value: amountSchema,
        maxDiscountAmount: amountSchema.optional(),
      })
      .strict()
      .refine(
        (discount) =>
          discount.type !== DiscountType.PERCENTAGE || discount.value <= 100,
        {
          message: errorMessage.invalid("Percentage discount"),
          path: ["value"],
        },
      ),
    criteria: z
      .object({
        minOrderValue: amountSchema.optional(),
        validDays: daysSchema.optional(),
        startTime: timeSchema.optional(),
        endTime: timeSchema.optional(),
        applicableItemIds: z.array(objectIdSchema).optional(),
        applicableCategoryIds: z.array(objectIdSchema).optional(),
      })
      .strict()
      .optional(),
    usage: z
      .object({
        maxTotalUses: z.number().int().min(0).optional(),
        maxUsesPerCustomer: z.number().int().min(0).optional(),
      })
      .strict()
      .optional(),
    status: z.nativeEnum(PromoStatus).optional(),
    validFrom: dateSchema.optional(),
    validUntil: dateSchema.optional(),
  })
  .strict();
export const updatePromoSchema = createPromoSchema.partial();
