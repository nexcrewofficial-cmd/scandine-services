import { ShiftStatus, BreakType } from '../enums/shift.enum.js';

export interface IShiftBreak {
  startTime: Date;
  endTime?: Date;
  type: BreakType;
}

export interface IShiftMetrics {
  totalRegularHours: number;
  totalOvertimeHours: number;
}

export interface IStaffShift {
  _id?: string;
  venueId: string;
  userId: string;
  clockInTime: Date;
  clockOutTime?: Date;
  breaks?: IShiftBreak[];
  hourlyRateApplied: number;
  metrics?: IShiftMetrics;
  status: ShiftStatus;
  approvedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}
