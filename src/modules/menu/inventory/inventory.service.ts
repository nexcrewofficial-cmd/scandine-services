import { FilterQuery } from "mongoose";
import { InventoryModel, IInventoryDocument } from "./inventory.model.js";
import { AppError, errorMessage } from "../../../shared/constants/messages.constant.js";
import { IInventory, IngredientCategory, InventoryQueryFilters, PaginatedResult } from "@scan-and-dine/shared-types";
import {
  parsePaginationQuery,
  parseBooleanFilter,
  escapeRegex,
  buildPaginationMeta,
} from "../../../shared/utils/query.util.js";

export class InventoryService {
  static async list(
    venueId: string,
    rawQuery: InventoryQueryFilters = {}
  ): Promise<PaginatedResult<IInventoryDocument>> {
    const { page, limit, skip, hasPaging, search, sort } = parsePaginationQuery(rawQuery, {
      name: 1,
    });

    const query: FilterQuery<IInventoryDocument> = { venueId, deletedAt: null };

    if (rawQuery.category && typeof rawQuery.category === "string") {
      query.category = rawQuery.category as IngredientCategory;
    }

    const isActive = parseBooleanFilter(rawQuery.isActive);
    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    const lowStock = parseBooleanFilter(rawQuery.lowStock);
    if (lowStock === true) {
      query.$expr = { $lte: ["$stock.current", "$stock.lowStockThreshold"] };
    }

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      query.$or = [{ name: regex }, { sku: regex }, { "supplierInfo.name": regex }];
    }

    const total = await InventoryModel.countDocuments(query);
    const mQuery = InventoryModel.find(query).sort(sort);

    if (hasPaging) {
      mQuery.skip(skip).limit(limit);
    }

    const data = await mQuery;
    const meta = buildPaginationMeta(total, data.length, page, hasPaging ? limit : total || 1);

    return { data, meta };
  }

  static async getById(venueId: string, id: string): Promise<IInventoryDocument> {
    const item = await InventoryModel.findOne({ _id: id, venueId, deletedAt: null });
    if (!item) {
      throw AppError.notFound(errorMessage.notFound("Inventory item"));
    }
    return item;
  }

  static async create(venueId: string, data: Partial<IInventory>): Promise<IInventoryDocument> {
    const existing = await InventoryModel.findOne({ venueId, sku: data.sku });
    if (existing) {
      throw AppError.conflict(errorMessage.skuAlreadyExists);
    }
    return InventoryModel.create({ ...data, venueId });
  }

  static async update(
    venueId: string,
    id: string,
    updates: Partial<IInventory>
  ): Promise<IInventoryDocument> {
    const item = await InventoryModel.findOneAndUpdate(
      { _id: id, venueId, deletedAt: null },
      updates,
      { new: true }
    );
    if (!item) {
      throw AppError.notFound(errorMessage.notFound("Inventory item"));
    }
    return item;
  }

  static async delete(venueId: string, id: string): Promise<void> {
    const item = await InventoryModel.findOneAndUpdate(
      { _id: id, venueId },
      { deletedAt: new Date() }
    );
    if (!item) {
      throw AppError.notFound(errorMessage.notFound("Inventory item"));
    }
  }
}
