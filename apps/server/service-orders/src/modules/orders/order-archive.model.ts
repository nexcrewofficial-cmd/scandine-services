import mongoose, { Schema, Document } from 'mongoose';
import { IOrder } from '@scan-and-dine/shared-types';

export interface IArchivedOrderDocument extends Omit<IOrder, '_id'>, Document {
  archivedAt: Date;
}

const ArchivedOrderSchema = new Schema<IArchivedOrderDocument>(
  {
    venueId: { type: Schema.Types.ObjectId as any, ref: 'Venue', required: true, index: true },
    customerUUID: { type: String },
    orderNumber: { type: String, required: true },
    tableNumber: { type: String },
    orderType: { type: String },
    status: { type: String },
    items: [{ type: Schema.Types.Mixed }],
    financials: { type: Schema.Types.Mixed },
    paymentStatus: { type: String },
    paymentMethod: { type: String },
    timing: { type: Schema.Types.Mixed },
    notes: { type: String },
    version: { type: Number },
    archivedAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
    collection: 'archived_orders',
  }
);

ArchivedOrderSchema.index({ venueId: 1, createdAt: -1 });

export const ArchivedOrderModel = mongoose.model<IArchivedOrderDocument>(
  'ArchivedOrder',
  ArchivedOrderSchema
);
