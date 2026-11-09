import mongoose, { Schema, Document } from 'mongoose';
import { IInventory, StockUnit, IngredientCategory } from '@scan-and-dine/shared-types';

export interface IInventoryDocument extends Omit<IInventory, '_id'>, Document {}

const InventorySchema = new Schema<IInventoryDocument>(
  {
    venueId: { type: Schema.Types.ObjectId as any, ref: 'Venue', required: true, index: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: Object.values(IngredientCategory),
      default: IngredientCategory.PRODUCE,
      index: true,
    },
    stock: {
      current: { type: Number, required: true, default: 0 },
      unit: { type: String, enum: Object.values(StockUnit), default: StockUnit.PIECE },
      lowStockThreshold: { type: Number, default: 5 },
      maximumCapacity: { type: Number },
    },
    expiryTracking: [
      {
        batchId: { type: String, required: true },
        expirationDate: { type: Date, required: true },
        quantity: { type: Number, required: true },
      },
    ],
    financials: {
      costPerUnit: { type: Number, required: true, default: 0 },
      lastPurchasePrice: { type: Number },
    },
    supplierInfo: {
      name: { type: String },
      contactEmail: { type: String },
      contactPhone: { type: String },
      autoReorder: { type: Boolean, default: false },
    },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

InventorySchema.index({ venueId: 1, sku: 1 }, { unique: true });

export const InventoryModel = mongoose.model<IInventoryDocument>('Inventory', InventorySchema);
