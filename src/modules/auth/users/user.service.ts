import { AuthenticatedUser } from "../../../shared/middlewares/auth.middleware.js";
import { authorizeStaffMutation } from "./user.authorization.js";
import { FilterQuery } from "mongoose";
import bcrypt from "bcryptjs";
import { UserModel, IUserDocument } from "./user.model.js";
import { AppError, errorMessage } from "../../../shared/constants/messages.constant.js";
import {
  RegisterStaffDTO,
  UserRole,
  EmploymentType,
  StaffQueryFilters,
  PaginatedResult,
} from "@scan-and-dine/shared-types";
import {
  parsePaginationQuery,
  parseBooleanFilter,
  escapeRegex,
  buildPaginationMeta,
} from "../../../shared/utils/query.util.js";

export class UserService {
  static async getStaffByVenue(
    venueId: string,
    rawQuery: StaffQueryFilters = {}
  ): Promise<PaginatedResult<IUserDocument>> {
    const { page, limit, skip, hasPaging, search, sort } = parsePaginationQuery(rawQuery, {
      createdAt: -1,
    });

    const query: FilterQuery<IUserDocument> = { venueId, deletedAt: null };

    if (rawQuery.role && typeof rawQuery.role === "string") {
      query.role = rawQuery.role as UserRole;
    }

    if (rawQuery.employmentType && typeof rawQuery.employmentType === "string") {
      query.employmentType = rawQuery.employmentType as EmploymentType;
    }

    const isActive = parseBooleanFilter(rawQuery.isActive);
    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      query.$or = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { phoneNumber: regex },
        { employeeId: regex },
      ];
    }

    const total = await UserModel.countDocuments(query);
    const mQuery = UserModel.find(query)
      .select("-passwordHash -pinCodeHash -twoFactorSecret")
      .sort(sort);

    if (hasPaging) {
      mQuery.skip(skip).limit(limit);
    }

    const data = await mQuery;
    const meta = buildPaginationMeta(total, data.length, page, hasPaging ? limit : total || 1);

    return { data, meta };
  }

  static async getStaffById(venueId: string, userId: string): Promise<IUserDocument> {
    const user = await UserModel.findOne({ _id: userId, venueId, deletedAt: null }).select(
      "-passwordHash -pinCodeHash -twoFactorSecret"
    );
    if (!user) {
      throw AppError.notFound(errorMessage.notFound("Staff member"));
    }
    return user;
  }

  static async createStaff(venueId: string, data: RegisterStaffDTO, actor: AuthenticatedUser): Promise<IUserDocument> {
    await authorizeStaffMutation(actor, venueId, undefined, data.role);
    const existing = await UserModel.findOne({ venueId, email: data.email.toLowerCase() });
    if (existing) {
      throw AppError.conflict(errorMessage.emailInUse);
    }

    const salt = await bcrypt.genSalt(10);
    const pinCodeHash = await bcrypt.hash(data.pinCode, salt);
    const passwordHash = data.password ? await bcrypt.hash(data.password, salt) : undefined;

    const user = await UserModel.create({
      ...data,
      venueId,
      pinCodeHash,
      passwordHash,
    });

    return user;
  }

  static async updateStaff(
    venueId: string,
    userId: string,
    data: Partial<RegisterStaffDTO>,
    actor: AuthenticatedUser
  ): Promise<IUserDocument> {
    await authorizeStaffMutation(actor, venueId);
    const user = await UserModel.findOne({ _id: userId, venueId, deletedAt: null }).select(
      "-passwordHash -pinCodeHash -twoFactorSecret"
    );
    if (!user) {
      throw AppError.notFound(errorMessage.notFound("Staff member"));
    }

    await authorizeStaffMutation(actor, venueId, user.role, data.role);

    if (data.pinCode) {
      const salt = await bcrypt.genSalt(10);
      user.pinCodeHash = await bcrypt.hash(data.pinCode, salt);
    }

    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(data.password, salt);
    }

    if (data.firstName) user.firstName = data.firstName;
    if (data.lastName) user.lastName = data.lastName;
    if (data.role) user.role = data.role;
    if (data.hourlyRate !== undefined) user.hourlyRate = data.hourlyRate;
    if (data.phoneNumber) user.phoneNumber = data.phoneNumber;

    await user.save();
    return user;
  }

  static async deactivateStaff(venueId: string, userId: string, actor: AuthenticatedUser): Promise<void> {
    await authorizeStaffMutation(actor, venueId);
    const target = await UserModel.findOne({ _id: userId, venueId, deletedAt: null });
    if (!target) {
      throw AppError.notFound(errorMessage.notFound("Staff member"));
    }
    await authorizeStaffMutation(actor, venueId, target.role);
    const user = await UserModel.findOneAndUpdate(
      { _id: userId, venueId, deletedAt: null, role: target.role },
      { isActive: false, deletedAt: new Date() }
    );
    if (!user) {
      throw AppError.notFound(errorMessage.notFound("Staff member"));
    }
  }
}
