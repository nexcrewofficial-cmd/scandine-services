import type { z } from "zod";
import type { createCategorySchema, updateCategorySchema } from "./category.validation.js";
export interface ICategory {
  _id?: string;
  venueId: string;
  name: string;
  description?: string;
  sortOrder: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface CreateCategoryDTO {
  venueId: string;
  name: string;
  description?: string;
  sortOrder?: number;
  imageUrl?: string;
}

export type CreateCategoryInput = z.input<typeof createCategorySchema>;
export type UpdateCategoryInput = z.input<typeof updateCategorySchema>;
