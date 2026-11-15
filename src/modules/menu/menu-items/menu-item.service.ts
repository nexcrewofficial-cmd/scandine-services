import { FilterQuery } from "mongoose";
import { MenuItemModel, IMenuItemDocument } from "./menu-item.model.js";
import { CategoryModel } from "../categories/category.model.js";
import { VenueModel } from "../venues/venue.model.js";
import { AppError, errorMessage } from "../../../shared/constants/messages.constant.js";
import {
  CreateMenuItemDTO,
  UpdateMenuItemDTO,
  StationTag,
  MenuItemQueryFilters,
  PaginatedResult,
} from "@scan-and-dine/shared-types";
import { publishEvent, EventChannels } from "@scan-and-dine/event-bus";
import {
  parsePaginationQuery,
  parseBooleanFilter,
  escapeRegex,
  buildPaginationMeta,
} from "../../../shared/utils/query.util.js";

export class MenuItemService {
  static async getPublicCatalog(venueSlug: string) {
    const venue = await VenueModel.findOne({ slug: venueSlug.toLowerCase(), isActive: true });
    if (!venue) {
      throw AppError.notFound(errorMessage.notFound("Venue"));
    }

    const categories = await CategoryModel.find({
      venueId: venue._id,
      isActive: true,
      deletedAt: null,
    }).sort({ sortOrder: 1 });

    const items = await MenuItemModel.find({
      venueId: venue._id,
      deletedAt: null,
    }).sort({ name: 1 });

    return {
      venue: {
        id: venue._id,
        name: venue.name,
        slug: venue.slug,
        bannerUrl: venue.bannerUrl,
        logoUrl: venue.logoUrl,
        operatingMode: venue.operatingMode,
        settings: venue.settings,
        featureFlags: venue.featureFlags,
      },
      categories,
      items,
    };
  }

  static async listItems(
    venueId: string,
    rawQuery: MenuItemQueryFilters = {}
  ): Promise<PaginatedResult<IMenuItemDocument>> {
    const { page, limit, skip, hasPaging, search, sort } = parsePaginationQuery(rawQuery, {
      name: 1,
    });

    const query: FilterQuery<IMenuItemDocument> = { venueId, deletedAt: null };

    if (rawQuery.categoryId && typeof rawQuery.categoryId === "string") {
      query.categoryId = rawQuery.categoryId;
    }

    const isAvailable = parseBooleanFilter(rawQuery.isAvailable);
    if (isAvailable !== undefined) {
      query.isAvailable = isAvailable;
    }

    if (rawQuery.stationTag && typeof rawQuery.stationTag === "string") {
      query.stationTag = rawQuery.stationTag as StationTag;
    }

    if (rawQuery.minPrice !== undefined || rawQuery.maxPrice !== undefined) {
      const priceFilter: Record<string, number> = {};
      if (rawQuery.minPrice !== undefined) {
        const min = Number(rawQuery.minPrice);
        if (!isNaN(min)) priceFilter.$gte = min;
      }
      if (rawQuery.maxPrice !== undefined) {
        const max = Number(rawQuery.maxPrice);
        if (!isNaN(max)) priceFilter.$lte = max;
      }
      if (Object.keys(priceFilter).length > 0) {
        query.price = priceFilter;
      }
    }

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      query.$or = [{ name: regex }, { shortName: regex }, { description: regex }];
    }

    const total = await MenuItemModel.countDocuments(query);
    const mQuery = MenuItemModel.find(query).populate("categoryId", "name").sort(sort);

    if (hasPaging) {
      mQuery.skip(skip).limit(limit);
    }

    const data = await mQuery;
    const meta = buildPaginationMeta(total, data.length, page, hasPaging ? limit : total || 1);

    return { data, meta };
  }

  static async getItemById(venueId: string, itemId: string): Promise<IMenuItemDocument> {
    const item = await MenuItemModel.findOne({ _id: itemId, venueId, deletedAt: null });
    if (!item) {
      throw AppError.notFound(errorMessage.notFound("Menu item"));
    }
    return item;
  }

  static async createItem(venueId: string, dto: CreateMenuItemDTO): Promise<IMenuItemDocument> {
    return MenuItemModel.create({ ...dto, venueId });
  }

  static async updateItem(
    venueId: string,
    itemId: string,
    updates: UpdateMenuItemDTO
  ): Promise<IMenuItemDocument> {
    const item = await MenuItemModel.findOneAndUpdate(
      { _id: itemId, venueId, deletedAt: null },
      updates,
      { new: true }
    );
    if (!item) {
      throw AppError.notFound(errorMessage.notFound("Menu item"));
    }
    return item;
  }

  // Instant Out-of-Stock Toggle
  static async toggleAvailability(
    venueId: string,
    itemId: string,
    isAvailable: boolean
  ): Promise<IMenuItemDocument> {
    const item = await MenuItemModel.findOneAndUpdate(
      { _id: itemId, venueId, deletedAt: null },
      { isAvailable },
      { new: true }
    );

    if (!item) {
      throw AppError.notFound(errorMessage.notFound("Menu item"));
    }

    // Publish event across Redis bus so service-websockets notifies all active customer phones
    await publishEvent(
      isAvailable ? EventChannels.ITEM_RESTOCKED : EventChannels.ITEM_86ED,
      {
        venueId,
        menuItemId: item._id.toString(),
        isAvailable,
        timestamp: new Date().toISOString(),
      }
    );

    return item;
  }

  static async deleteItem(venueId: string, itemId: string): Promise<void> {
    const item = await MenuItemModel.findOneAndUpdate(
      { _id: itemId, venueId },
      { deletedAt: new Date() }
    );
    if (!item) {
      throw AppError.notFound(errorMessage.notFound("Menu item"));
    }
  }
}
