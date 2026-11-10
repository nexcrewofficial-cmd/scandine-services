import mongoose, { Schema, Document } from 'mongoose';
import { IStaffShift, ShiftStatus, BreakType } from '@scan-and-dine/shared-types';

export interface IStaffShiftDocument extends Omit<IStaffShift, '_id'>, Document {}

const StaffShiftSchema = new Schema<IStaffShiftDocument>(
  {
    venueId: { type: Schema.Types.ObjectId as any, ref: 'Venue', required: true, index: true },
    userId: { type: Schema.Types.ObjectId as any, ref: 'User', required: true, index: true },
    clockInTime: { type: Date, required: true },
    clockOutTime: { type: Date },
    breaks: [
      {
        startTime: { type: Date, required: true },
        endTime: { type: Date },
        type: {
          type: String,
          enum: Object.values(BreakType),
          default: BreakType.UNPAID_MEAL,
        },
      },
    ],
    hourlyRateApplied: { type: Number, required: true },
    metrics: {
      totalRegularHours: { type: Number, default: 0 },
      totalOvertimeHours: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: Object.values(ShiftStatus),
      default: ShiftStatus.ACTIVE,
      index: true,
    },
    approvedBy: { type: Schema.Types.ObjectId as any, ref: 'User' },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

StaffShiftSchema.index({ venueId: 1, userId: 1, status: 1 });

export const StaffShiftModel = mongoose.model<IStaffShiftDocument>(
  'StaffShift',
  StaffShiftSchema
);
