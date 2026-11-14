import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { UserModel, IUserDocument } from "../users/user.model.js";
import { AppError, errorMessage } from "../../../shared/middlewares/index.js";
import { config } from "../../../config/env.js";
import { AdminLoginDTO, StaffPinLoginDTO, AuthTokens, JwtAuthPayload } from "./auth.interface.js";

interface VenuePinRateLimit {
  attempts: number;
  lockedUntil?: Date;
}

export class AuthService {
  private static venuePinRateLimits = new Map<string, VenuePinRateLimit>();
  private static generateTokens(user: IUserDocument): { accessToken: string; refreshToken: string } {
    const payload: JwtAuthPayload = {
      userId: user._id.toString(),
      venueId: user.venueId ? user.venueId.toString() : undefined,
      role: user.role,
      email: user.email,
    };

    const accessSignOptions: SignOptions = {
      expiresIn: config.jwtExpiresIn as SignOptions["expiresIn"],
    };
    const accessToken = jwt.sign(payload, config.jwtSecret, accessSignOptions);

    const refreshSignOptions: SignOptions = {
      expiresIn: config.jwtRefreshExpiresIn as SignOptions["expiresIn"],
    };
    const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, refreshSignOptions);

    return { accessToken, refreshToken };
  }

  static async adminLogin(dto: AdminLoginDTO): Promise<AuthTokens> {
    const user = await UserModel.findOne({
      email: dto.email.toLowerCase(),
      deletedAt: null,
    });

    if (!user) {
      throw AppError.unauthorized(errorMessage.invalidCredentials);
    }

    if (!user.isActive) {
      throw AppError.forbidden(errorMessage.accountDeactivated);
    }

    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      throw AppError.forbidden(errorMessage.accountLocked);
    }

    if (!user.passwordHash) {
      throw AppError.unauthorized(errorMessage.passwordNotConfigured);
    }

    const isMatch = await bcrypt.compare(dto.password || "", user.passwordHash);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.accountLockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
      }
      await user.save();
      throw AppError.unauthorized(errorMessage.invalidCredentials);
    }

    // Reset failed login attempts
    user.failedLoginAttempts = 0;
    user.accountLockedUntil = undefined;
    user.lastLoginAt = new Date();
    await user.save();

    const tokens = this.generateTokens(user);

    return {
      ...tokens,
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        venueId: user.venueId?.toString(),
      },
    };
  }

  static async staffPinLogin(dto: StaffPinLoginDTO): Promise<AuthTokens> {
    let matchedStaff: IUserDocument | null = null;

    if (dto.employeeId) {
      // 1. Employee ID provided: direct user lookup with individual lock & attempt tracking
      const staff = await UserModel.findOne({
        venueId: dto.venueId,
        employeeId: dto.employeeId,
        deletedAt: null,
      });

      if (!staff) {
        throw AppError.unauthorized(errorMessage.invalidPin);
      }

      if (!staff.isActive) {
        throw AppError.forbidden(errorMessage.accountDeactivated);
      }

      if (staff.accountLockedUntil && staff.accountLockedUntil > new Date()) {
        throw AppError.forbidden(errorMessage.accountLocked);
      }

      if (!staff.pinCodeHash) {
        throw AppError.unauthorized(errorMessage.invalidPin);
      }

      const isMatch = await bcrypt.compare(dto.pinCode, staff.pinCodeHash);
      if (!isMatch) {
        staff.failedLoginAttempts = (staff.failedLoginAttempts || 0) + 1;
        if (staff.failedLoginAttempts >= 5) {
          staff.accountLockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
        }
        await staff.save();
        throw AppError.unauthorized(errorMessage.invalidPin);
      }

      matchedStaff = staff;
    } else {
      // 2. Shared POS / KDS tablet quick PIN login: rate-limit by venue and inspect all staff
      const rateLimitKey = dto.venueId;
      const rateLimit = AuthService.venuePinRateLimits.get(rateLimitKey);

      if (rateLimit?.lockedUntil && rateLimit.lockedUntil > new Date()) {
        throw AppError.forbidden(errorMessage.accountLocked);
      }

      const staffMembers = await UserModel.find({
        venueId: dto.venueId,
        deletedAt: null,
      });

      for (const staff of staffMembers) {
        if (staff.pinCodeHash) {
          const isMatch = await bcrypt.compare(dto.pinCode, staff.pinCodeHash);
          if (isMatch) {
            matchedStaff = staff;
            break;
          }
        }
      }

      if (!matchedStaff) {
        const currentAttempts = (rateLimit?.attempts || 0) + 1;
        if (currentAttempts >= 5) {
          AuthService.venuePinRateLimits.set(rateLimitKey, {
            attempts: currentAttempts,
            lockedUntil: new Date(Date.now() + 15 * 60 * 1000), // 15 min lock
          });
        } else {
          AuthService.venuePinRateLimits.set(rateLimitKey, {
            attempts: currentAttempts,
          });
        }
        throw AppError.unauthorized(errorMessage.invalidPin);
      }

      if (!matchedStaff.isActive) {
        throw AppError.forbidden(errorMessage.accountDeactivated);
      }

      if (matchedStaff.accountLockedUntil && matchedStaff.accountLockedUntil > new Date()) {
        throw AppError.forbidden(errorMessage.accountLocked);
      }

      // Reset venue-level rate limit on successful PIN match
      AuthService.venuePinRateLimits.delete(rateLimitKey);
    }

    // Reset failed login attempts and unlock user on successful login
    matchedStaff.failedLoginAttempts = 0;
    matchedStaff.accountLockedUntil = undefined;
    matchedStaff.lastLoginAt = new Date();
    await matchedStaff.save();

    const tokens = this.generateTokens(matchedStaff);

    return {
      ...tokens,
      user: {
        id: matchedStaff._id.toString(),
        firstName: matchedStaff.firstName,
        lastName: matchedStaff.lastName,
        email: matchedStaff.email,
        role: matchedStaff.role,
        venueId: matchedStaff.venueId?.toString(),
      },
    };
  }

  static async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret) as JwtAuthPayload;
      const user = await UserModel.findById(decoded.userId);

      if (!user || !user.isActive) {
        throw AppError.unauthorized(errorMessage.notFound("User"));
      }

      const payload: JwtAuthPayload = {
        userId: user._id.toString(),
        venueId: user.venueId ? user.venueId.toString() : undefined,
        role: user.role,
        email: user.email,
      };

      const accessSignOptions: SignOptions = {
        expiresIn: config.jwtExpiresIn as SignOptions["expiresIn"],
      };
      const accessToken = jwt.sign(payload, config.jwtSecret, accessSignOptions);

      return { accessToken };
    } catch {
      throw AppError.unauthorized(errorMessage.tokenExpired);
    }
  }
}
