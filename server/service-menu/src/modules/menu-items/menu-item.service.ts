import { MenuItemModel, IMenuItemDocument } from './menu-item.model.js';
import { CategoryModel } from '../categories/category.model.js';
import { VenueModel } from '../venues/venue.model.js';
import { AppError } from '@scan-and-dine/shared-middlewares';
import { CreateMenuItemDTO, UpdateMenuItemDTO } from '@scan-and-dine/shared-types';
import { publishEvent, EventChannels } from '@scan-and-dine/event-bus';

export class MenuItemService {
  static async getPublicCatalog(venueSlug: string) {
    const venue = await VenueModel.findOne({ slug: venueSlug.toLowerCase(), isActive: true });
    if (!venue) {
      throw AppError.notFound('Venue not found');
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

  static async listItems(venueId: string): Promise<IMenuItemDocument[]> {
    return MenuItemModel.find({ venueId, deletedAt: null }).populate('categoryId', 'name');
  }

  static async getItemById(venueId: string, itemId: string): Promise<IMenuItemDocument> {
    const item = await MenuItemModel.findOne({ _id: itemId, venueId, deletedAt: null });
    if (!item) {
      throw AppError.notFound('Menu item not found');
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
      throw AppError.notFound('Menu item not found');
    }
    return item;
  }

  // 86-ing: Instant Out-of-Stock Toggle
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
      throw AppError.notFound('Menu item not found');
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
      throw AppError.notFound('Menu item not found');
    }
  }
}
