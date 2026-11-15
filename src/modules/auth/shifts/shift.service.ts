import { FilterQuery } from "mongoose";
import { StaffShiftModel, IStaffShiftDocument } from "./shift.model.js";
import { UserModel } from "../users/user.model.js";
import { AppError, errorMessage } from "../../../shared/constants/messages.constant.js";
import { ShiftStatus, ShiftQueryFilters, PaginatedResult } from "@scan-and-dine/shared-types";
import {
  parsePaginationQuery,
  buildPaginationMeta,
} from "../../../shared/utils/query.util.js";

export class ShiftService {
  static async clockIn(venueId: string, userId: string): Promise<IStaffShiftDocument> {
    const activeShift = await StaffShiftModel.findOne({
      venueId,
      userId,
      status: ShiftStatus.ACTIVE,
    });

    if (activeShift) {
      throw AppError.conflict(errorMessage.activeShiftInProgress);
    }

    const user = await UserModel.findOne({ _id: userId, venueId });
    if (!user) {
      throw AppError.notFound(errorMessage.notFound("Staff user"));
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
      throw AppError.notFound(errorMessage.noActiveShift);
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

  static async listShifts(
    venueId: string,
    rawQuery: ShiftQueryFilters = {}
  ): Promise<PaginatedResult<IStaffShiftDocument>> {
    const { page, limit, skip, hasPaging, sort } = parsePaginationQuery(rawQuery, {
      clockInTime: -1,
    });

    const query: FilterQuery<IStaffShiftDocument> = { venueId, deletedAt: null };

    if (rawQuery.userId && typeof rawQuery.userId === "string") {
      query.userId = rawQuery.userId;
    }

    if (rawQuery.status && typeof rawQuery.status === "string") {
      query.status = rawQuery.status as ShiftStatus;
    }

    if (rawQuery.startDate || rawQuery.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (rawQuery.startDate) {
        const d = new Date(rawQuery.startDate as string);
        if (!isNaN(d.getTime())) dateFilter.$gte = d;
      }
      if (rawQuery.endDate) {
        const d = new Date(rawQuery.endDate as string);
        if (!isNaN(d.getTime())) dateFilter.$lte = d;
      }
      if (Object.keys(dateFilter).length > 0) {
        query.clockInTime = dateFilter;
      }
    }

    const total = await StaffShiftModel.countDocuments(query);
    const mQuery = StaffShiftModel.find(query)
      .populate("userId", "firstName lastName email role employeeId")
      .sort(sort);

    if (hasPaging) {
      mQuery.skip(skip).limit(limit);
    }

    const data = await mQuery;
    const meta = buildPaginationMeta(total, data.length, page, hasPaging ? limit : total || 1);

    return { data, meta };
  }
}
