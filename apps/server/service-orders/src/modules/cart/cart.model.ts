import mongoose, { Schema, Document } from 'mongoose';
import { IOrderItem } from '@scan-and-dine/shared-types';

export interface ICartDocument extends Document {
  venueId: mongoose.Types.ObjectId;
  customerUUID: string;
  tableNumber?: string;
  items: IOrderItem[];
  appliedPromoCode?: string;
  discountAmount?: number;
  updatedAt: Date;
}

const CartSchema = new Schema<ICartDocument>(
  {
    venueId: { type: Schema.Types.ObjectId, ref: 'Venue', required: true, index: true },
    customerUUID: { type: String, required: true, index: true },
    tableNumber: { type: String },
    items: [
      {
        menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true },
        modifiersSelected: [
          {
            groupName: { type: String, required: true },
            optionName: { type: String, required: true },
            extraPrice: { type: Number, default: 0 },
          },
        ],
        itemTotal: { type: Number, required: true },
        specialInstructions: { type: String },
      },
    ],
    appliedPromoCode: { type: String },
    discountAmount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

CartSchema.index({ venueId: 1, customerUUID: 1 }, { unique: true });

export const CartModel = mongoose.model<ICartDocument>('Cart', CartSchema);
