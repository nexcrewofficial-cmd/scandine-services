import type { CreateCategoryInput, UpdateCategoryInput } from "./category.interface.js";
import { createCategorySchema, updateCategorySchema } from "./category.validation.js";
import { flattenUpdate } from "../../../shared/utils/update.util.js";
import { FilterQuery } from "mongoose";
import { CategoryModel, ICategoryDocument } from "./category.model.js";
import { AppError, errorMessage } from "../../../shared/constants/messages.constant.js";
import { CategoryQueryFilters, PaginatedResult } from "@scan-and-dine/shared-types";
import {
  parsePaginationQuery,
  parseBooleanFilter,
  escapeRegex,
  buildPaginationMeta,
} from "../../../shared/utils/query.util.js";

export class CategoryService {
  static async listCategories(
    venueId: string,
    rawQuery: CategoryQueryFilters = {}
  ): Promise<PaginatedResult<ICategoryDocument>> {
    const { page, limit, skip, hasPaging, search, sort } = parsePaginationQuery(rawQuery, {
      sortOrder: 1,
      createdAt: 1,
    });

    const query: FilterQuery<ICategoryDocument> = { venueId, deletedAt: null };

    const isActive = parseBooleanFilter(rawQuery.isActive ?? (rawQuery.onlyActive ? true : undefined));
    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      query.$or = [{ name: regex }, { description: regex }];
    }

    const total = await CategoryModel.countDocuments(query);
    const mQuery = CategoryModel.find(query).sort(sort);

    if (hasPaging) {
      mQuery.skip(skip).limit(limit);
    }

    const data = await mQuery;
    const meta = buildPaginationMeta(total, data.length, page, hasPaging ? limit : total || 1);

    return { data, meta };
  }

  static async createCategory(venueId: string, dto: CreateCategoryInput): Promise<ICategoryDocument> {
    const sanitized = createCategorySchema.parse(dto);
    return CategoryModel.create({ ...sanitized, venueId });
  }

  static async updateCategory(
    venueId: string,
    categoryId: string,
    updates: UpdateCategoryInput
  ): Promise<ICategoryDocument> {
    const category = await CategoryModel.findOneAndUpdate(
      { _id: categoryId, venueId, deletedAt: null },
      { $set: flattenUpdate(updateCategorySchema.parse(updates)) },
      { new: true, runValidators: true }
    );
    if (!category) {
      throw AppError.notFound(errorMessage.notFound("Category"));
    }
    return category;
  }

  static async deleteCategory(venueId: string, categoryId: string): Promise<void> {
    const category = await CategoryModel.findOneAndUpdate(
      { _id: categoryId, venueId },
      { isActive: false, deletedAt: new Date() }
    );
    if (!category) {
      throw AppError.notFound(errorMessage.notFound("Category"));
    }
  }
}
