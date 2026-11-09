import mongoose, { Schema, Document } from 'mongoose';
import { IPrinter, PrinterType, PrinterStatus, StationTag } from '@scan-and-dine/shared-types';

export interface IPrinterDocument extends Omit<IPrinter, '_id'>, Document {}

const PrinterSchema = new Schema<IPrinterDocument>(
  {
    venueId: { type: Schema.Types.ObjectId as any, ref: 'Venue', required: true, index: true },
    name: { type: String, required: true, trim: true },
    macAddress: { type: String, required: true, trim: true },
    ipAddress: { type: String, required: true, trim: true },
    port: { type: Number, default: 9100 },
    printerType: {
      type: String,
      enum: Object.values(PrinterType),
      default: PrinterType.THERMAL_80MM,
    },
    stationTag: {
      type: String,
      enum: Object.values(StationTag),
      default: StationTag.MAIN_KITCHEN,
    },
    status: {
      type: String,
      enum: Object.values(PrinterStatus),
      default: PrinterStatus.ONLINE,
    },
    rules: {
      printCustomerReceipt: { type: Boolean, default: true },
      printKOT: { type: Boolean, default: true },
      autoPrintNewOrder: { type: Boolean, default: true },
    },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

PrinterSchema.index({ venueId: 1, macAddress: 1 });

export const PrinterModel = mongoose.model<IPrinterDocument>('Printer', PrinterSchema);
