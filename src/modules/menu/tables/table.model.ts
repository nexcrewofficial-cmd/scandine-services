import mongoose, { Schema, Document } from "mongoose";

export interface ITableDocument extends Document {
  venueId: mongoose.Types.ObjectId;
  tableNumber: string;
  capacity: number;
  isActive: boolean;
  deletedAt: Date | null;
}

const TableSchema = new Schema<ITableDocument>({
  venueId: { type: Schema.Types.ObjectId, ref: "Venue", required: true, index: true },
  tableNumber: { type: String, required: true, trim: true },
  capacity: { type: Number, required: true, min: 1, validate: Number.isInteger },
  isActive: { type: Boolean, default: true },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

TableSchema.index(
  { venueId: 1, tableNumber: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } },
);

export const TableModel = mongoose.model<ITableDocument>("Table", TableSchema);
