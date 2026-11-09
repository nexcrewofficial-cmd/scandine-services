import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel, IUserDocument } from '../users/user.model.js';
import { AppError } from '@scan-and-dine/shared-middlewares';
import { config } from '../../config/env.js';
import { AdminLoginDTO, StaffPinLoginDTO } from '@scan-and-dine/shared-types';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    venueId?: string;
  };
}

export class AuthService {
  private static generateTokens(user: IUserDocument): { accessToken: string; refreshToken: string } {
    const payload = {
      userId: user._id.toString(),
      venueId: user.venueId ? user.venueId.toString() : undefined,
      role: user.role,
      email: user.email,
    };

    const accessToken = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    } as any);

    const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, {
      expiresIn: config.jwtRefreshExpiresIn,
    } as any);

    return { accessToken, refreshToken };
  }

  static async adminLogin(dto: AdminLoginDTO): Promise<AuthTokens> {
    const user = await UserModel.findOne({
      email: dto.email.toLowerCase(),
      deletedAt: null,
    });

    if (!user) {
      throw AppError.unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      throw AppError.forbidden('Your account is deactivated. Contact venue administrator.');
    }

    // Check account lockout
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      throw AppError.forbidden('Account temporarily locked due to multiple failed login attempts.');
    }

    if (!user.passwordHash) {
      throw AppError.unauthorized('Password not configured for this account');
    }

    const isMatch = await bcrypt.compare(dto.password || '', user.passwordHash);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.accountLockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
      }
      await user.save();
      throw AppError.unauthorized('Invalid email or password');
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
    const staffMembers = await UserModel.find({
      venueId: dto.venueId,
      isActive: true,
      deletedAt: null,
    });

    let matchedStaff: IUserDocument | null = null;

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
      throw AppError.unauthorized('Invalid 4-digit PIN code');
    }

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
      const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret) as any;
      const user = await UserModel.findById(decoded.userId);

      if (!user || !user.isActive) {
        throw AppError.unauthorized('User not found or inactive');
      }

      const payload = {
        userId: user._id.toString(),
        venueId: user.venueId ? user.venueId.toString() : undefined,
        role: user.role,
        email: user.email,
      };

      const accessToken = jwt.sign(payload, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn,
      } as any);

      return { accessToken };
    } catch {
      throw AppError.unauthorized('Invalid or expired refresh token');
    }
  }
}
