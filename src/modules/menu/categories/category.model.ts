import mongoose, { Schema, Document } from 'mongoose';
import { ICategory } from '@scan-and-dine/shared-types';

export interface ICategoryDocument extends Omit<ICategory, '_id'>, Document {}

const CategorySchema = new Schema<ICategoryDocument>(
  {
    venueId: { type: Schema.Types.ObjectId as any, ref: 'Venue', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    sortOrder: { type: Number, default: 0 },
    imageUrl: { type: String },
    isActive: { type: Boolean, default: true, index: true },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

CategorySchema.index({ venueId: 1, sortOrder: 1 });

export const CategoryModel = mongoose.model<ICategoryDocument>('Category', CategorySchema);
