import { InventoryModel, IInventoryDocument } from './inventory.model.js';
import { AppError } from '@scan-and-dine/shared-middlewares';
import { IInventory } from '@scan-and-dine/shared-types';

export class InventoryService {
  static async list(venueId: string): Promise<IInventoryDocument[]> {
    return InventoryModel.find({ venueId, deletedAt: null }).sort({ name: 1 });
  }

  static async getById(venueId: string, id: string): Promise<IInventoryDocument> {
    const item = await InventoryModel.findOne({ _id: id, venueId, deletedAt: null });
    if (!item) {
      throw AppError.notFound('Inventory item not found');
    }
    return item;
  }

  static async create(venueId: string, data: Partial<IInventory>): Promise<IInventoryDocument> {
    const existing = await InventoryModel.findOne({ venueId, sku: data.sku });
    if (existing) {
      throw AppError.conflict('An inventory item with this SKU already exists');
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
      throw AppError.notFound('Inventory item not found');
    }
    return item;
  }

  static async delete(venueId: string, id: string): Promise<void> {
    const item = await InventoryModel.findOneAndUpdate(
      { _id: id, venueId },
      { deletedAt: new Date() }
    );
    if (!item) {
      throw AppError.notFound('Inventory item not found');
    }
  }
}
