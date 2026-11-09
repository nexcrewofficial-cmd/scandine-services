import { StaffShiftModel, IStaffShiftDocument } from './shift.model.js';
import { UserModel } from '../users/user.model.js';
import { AppError } from '@scan-and-dine/shared-middlewares';
import { ShiftStatus } from '@scan-and-dine/shared-types';

export class ShiftService {
  static async clockIn(venueId: string, userId: string): Promise<IStaffShiftDocument> {
    const activeShift = await StaffShiftModel.findOne({
      venueId,
      userId,
      status: ShiftStatus.ACTIVE,
    });

    if (activeShift) {
      throw AppError.conflict('An active shift is already in progress for this staff member');
    }

    const user = await UserModel.findOne({ _id: userId, venueId });
    if (!user) {
      throw AppError.notFound('Staff user not found');
    }

    const shift = await StaffShiftModel.create({
      venueId,
      userId,
      clockInTime: new Date(),
      hourlyRateApplied: user.hourlyRate || 0,
      status: ShiftStatus.ACTIVE,
    });

    return shift;
  }

  static async clockOut(venueId: string, userId: string): Promise<IStaffShiftDocument> {
    const shift = await StaffShiftModel.findOne({
      venueId,
      userId,
      status: ShiftStatus.ACTIVE,
    });

    if (!shift) {
      throw AppError.notFound('No active shift found to clock out');
    }

    const now = new Date();
    shift.clockOutTime = now;
    shift.status = ShiftStatus.COMPLETED;

    // Calculate hours worked
    const diffMs = now.getTime() - shift.clockInTime.getTime();
    const hours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
    shift.metrics = {
      totalRegularHours: Math.min(hours, 8),
      totalOvertimeHours: Math.max(0, hours - 8),
    };

    await shift.save();
    return shift;
  }

  static async listShifts(venueId: string): Promise<IStaffShiftDocument[]> {
    return StaffShiftModel.find({ venueId, deletedAt: null })
      .populate('userId', 'firstName lastName email role employeeId')
      .sort({ clockInTime: -1 });
  }
}
