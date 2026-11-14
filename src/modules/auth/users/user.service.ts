import bcrypt from "bcryptjs";
import { UserModel, IUserDocument } from "./user.model.js";
import { AppError, errorMessage } from "../../../shared/constants/messages.constant.js";
import { RegisterStaffDTO } from "@scan-and-dine/shared-types";

export class UserService {
  static async getStaffByVenue(venueId: string): Promise<IUserDocument[]> {
    return UserModel.find({ venueId, deletedAt: null }).select("-passwordHash -pinCodeHash");
  }

  static async getStaffById(venueId: string, userId: string): Promise<IUserDocument> {
    const user = await UserModel.findOne({ _id: userId, venueId, deletedAt: null }).select(
      "-passwordHash -pinCodeHash"
    );
    if (!user) {
      throw AppError.notFound(errorMessage.notFound("Staff member"));
    }
    return user;
  }

  static async createStaff(venueId: string, data: RegisterStaffDTO): Promise<IUserDocument> {
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
    data: Partial<RegisterStaffDTO>
  ): Promise<IUserDocument> {
    const user = await UserModel.findOne({ _id: userId, venueId, deletedAt: null });
    if (!user) {
      throw AppError.notFound(errorMessage.notFound("Staff member"));
    }

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

  static async deactivateStaff(venueId: string, userId: string): Promise<void> {
    const user = await UserModel.findOneAndUpdate(
      { _id: userId, venueId },
      { isActive: false, deletedAt: new Date() }
    );
    if (!user) {
      throw AppError.notFound(errorMessage.notFound("Staff member"));
    }
  }
}
