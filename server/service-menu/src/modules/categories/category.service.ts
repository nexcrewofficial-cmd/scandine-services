import { CategoryModel, ICategoryDocument } from './category.model.js';
import { AppError } from '@scan-and-dine/shared-middlewares';
import { CreateCategoryDTO } from '@scan-and-dine/shared-types';

export class CategoryService {
  static async listCategories(venueId: string, onlyActive = false): Promise<ICategoryDocument[]> {
    const query: any = { venueId, deletedAt: null };
    if (onlyActive) query.isActive = true;
    return CategoryModel.find(query).sort({ sortOrder: 1, createdAt: 1 });
  }

  static async createCategory(venueId: string, dto: CreateCategoryDTO): Promise<ICategoryDocument> {
    return CategoryModel.create({ ...dto, venueId });
  }

  static async updateCategory(
    venueId: string,
    categoryId: string,
    updates: Partial<CreateCategoryDTO>
  ): Promise<ICategoryDocument> {
    const category = await CategoryModel.findOneAndUpdate(
      { _id: categoryId, venueId, deletedAt: null },
      updates,
      { new: true }
    );
    if (!category) {
      throw AppError.notFound('Category not found');
    }
    return category;
  }

  static async deleteCategory(venueId: string, categoryId: string): Promise<void> {
    const category = await CategoryModel.findOneAndUpdate(
      { _id: categoryId, venueId },
      { isActive: false, deletedAt: new Date() }
    );
    if (!category) {
      throw AppError.notFound('Category not found');
    }
  }
}
