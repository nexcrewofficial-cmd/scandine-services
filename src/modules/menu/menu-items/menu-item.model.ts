import mongoose, { Schema, Document } from 'mongoose';
import {
  IMenuItem,
  StationTag,
  DietaryTag,
  Allergen,
} from '@scan-and-dine/shared-types';

export interface IMenuItemDocument extends Omit<IMenuItem, '_id'>, Document {}

const MenuItemSchema = new Schema<IMenuItemDocument>(
  {
    venueId: { type: Schema.Types.ObjectId as any, ref: 'Venue', required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId as any, ref: 'Category', required: true, index: true },
    name: { type: String, required: true, trim: true },
    shortName: { type: String, trim: true },
    description: { type: String, trim: true },
    media: {
      imageUrl: { type: String },
      videoUrl: { type: String },
    },
    price: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, min: 0 },
    taxOverride: { type: Number },
    stationTag: {
      type: String,
      enum: Object.values(StationTag),
      default: StationTag.MAIN_KITCHEN,
      index: true,
    },
    modifierGroups: [
      {
        name: { type: String, required: true },
        required: { type: Boolean, default: false },
        minSelections: { type: Number, default: 0 },
        maxSelections: { type: Number, default: 1 },
        options: [
          {
            name: { type: String, required: true },
            extraPrice: { type: Number, default: 0 },
            isDefault: { type: Boolean, default: false },
          },
        ],
      },
    ],
    dietaryTags: [{ type: String, enum: Object.values(DietaryTag) }],
    allergens: [{ type: String, enum: Object.values(Allergen) }],
    calories: { type: Number },
    isAvailable: { type: Boolean, default: true, index: true }, // For instant 86-ing
    timeWindows: [
      {
        days: [{ type: String, enum: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] }],
        startTime: { type: String }, // e.g. "08:00"
        endTime: { type: String },   // e.g. "11:00"
      },
    ],
    soldOutUntil: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

MenuItemSchema.index({ venueId: 1, categoryId: 1, isAvailable: 1 });

export const MenuItemModel = mongoose.model<IMenuItemDocument>('MenuItem', MenuItemSchema);
