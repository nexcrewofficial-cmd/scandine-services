import { z } from "zod";
import { nameSchema } from "../../../shared/validation/menu.validation.js";

export const createCategorySchema = z
  .object({
    name: nameSchema,
    description: z.string().optional(),
    sortOrder: z.number().int().optional(),
    imageUrl: z.string().url().optional(),
    isActive: z.boolean().optional(),
  })
  .strict();
export const updateCategorySchema = createCategorySchema.partial();
