import { z } from "zod";
import { StockUnit, IngredientCategory } from "./inventory.enum.js";
import {
  nameSchema,
  amountSchema,
  dateSchema,
} from "../../../shared/validation/menu.validation.js";

export const createInventorySchema = z
  .object({
    name: nameSchema,
    sku: nameSchema,
    category: z.nativeEnum(IngredientCategory).optional(),
    stock: z
      .object({
        current: amountSchema.optional(),
        unit: z.nativeEnum(StockUnit).optional(),
        lowStockThreshold: amountSchema.optional(),
        maximumCapacity: amountSchema.optional(),
      })
      .strict()
      .optional(),
    expiryTracking: z
      .array(
        z
          .object({
            batchId: nameSchema,
            expirationDate: dateSchema,
            quantity: amountSchema,
          })
          .strict(),
      )
      .optional(),
    financials: z
      .object({
        costPerUnit: amountSchema.optional(),
        lastPurchasePrice: amountSchema.optional(),
      })
      .strict()
      .optional(),
    supplierInfo: z
      .object({
        name: nameSchema.optional(),
        contactEmail: z.string().email().optional(),
        contactPhone: z.string().optional(),
        autoReorder: z.boolean().optional(),
      })
      .strict()
      .optional(),
    isActive: z.boolean().optional(),
  })
  .strict();
export const updateInventorySchema = createInventorySchema.partial();
