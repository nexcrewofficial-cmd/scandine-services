import type { z } from "zod";
import type { createInventorySchema, updateInventorySchema } from "./inventory.validation.js";
import { StockUnit, IngredientCategory } from './inventory.enum.js';

export * from './inventory.enum.js';

export interface IExpiryBatch {
  batchId: string;
  expirationDate: Date;
  quantity: number;
}

export interface ISupplierInfo {
  name: string;
  contactEmail?: string;
  contactPhone?: string;
  autoReorder?: boolean;
}

export interface IInventoryStock {
  current: number;
  unit: StockUnit;
  lowStockThreshold: number;
  maximumCapacity?: number;
}

export interface IInventoryFinancials {
  costPerUnit: number;
  lastPurchasePrice?: number;
}

export interface IInventory {
  _id?: string;
  venueId: string;
  name: string;
  sku: string;
  category: IngredientCategory;
  stock: IInventoryStock;
  expiryTracking?: IExpiryBatch[];
  financials: IInventoryFinancials;
  supplierInfo?: ISupplierInfo;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export type CreateInventoryInput = z.input<typeof createInventorySchema>;
export type UpdateInventoryInput = z.input<typeof updateInventorySchema>;
