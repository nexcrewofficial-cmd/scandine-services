import { z } from "zod";
import { StationTag, DietaryTag, Allergen } from "./menu-item.enum.js";
import {
  nameSchema,
  amountSchema,
  objectIdSchema,
  daysSchema,
  timeSchema,
  dateSchema,
} from "../../../shared/validation/menu.validation.js";

export const createMenuItemSchema = z
  .object({
    categoryId: objectIdSchema,
    name: nameSchema,
    shortName: z.string().optional(),
    description: z.string().optional(),
    media: z
      .object({
        imageUrl: z.string().url().optional(),
        videoUrl: z.string().url().optional(),
      })
      .strict()
      .optional(),
    price: amountSchema,
    costPrice: amountSchema.optional(),
    taxOverride: amountSchema.max(100).optional(),
    stationTag: z.nativeEnum(StationTag).optional(),
    modifierGroups: z
      .array(
        z
          .object({
            name: nameSchema,
            required: z.boolean().optional(),
            minSelections: z.number().int().min(0).optional(),
            maxSelections: z.number().int().min(0).optional(),
            options: z.array(
              z
                .object({
                  name: nameSchema,
                  extraPrice: amountSchema.optional(),
                  isDefault: z.boolean().optional(),
                })
                .strict(),
            ),
          })
          .strict(),
      )
      .optional(),
    dietaryTags: z.array(z.nativeEnum(DietaryTag)).optional(),
    allergens: z.array(z.nativeEnum(Allergen)).optional(),
    calories: amountSchema.optional(),
    isAvailable: z.boolean().optional(),
    timeWindows: z
      .array(
        z
          .object({
            days: daysSchema,
            startTime: timeSchema,
            endTime: timeSchema,
          })
          .strict(),
      )
      .optional(),
    soldOutUntil: dateSchema.nullable().optional(),
  })
  .strict();
export const updateMenuItemSchema = createMenuItemSchema.partial();
export const menuItemAvailabilitySchema = z
  .object({ isAvailable: z.boolean() })
  .strict();
