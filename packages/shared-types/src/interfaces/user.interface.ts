import { UserRole, Gender, EmploymentType } from '../enums/role.enum.js';

export interface IUserEmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface IUser {
  _id?: string;
  venueId?: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  passwordHash?: string;
  pinCodeHash?: string;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  lastLoginAt?: Date;
  failedLoginAttempts?: number;
  accountLockedUntil?: Date;
  role: UserRole;
  customPermissions?: string[];
  employeeId?: string;
  hireDate?: Date;
  employmentType?: EmploymentType;
  hourlyRate?: number;
  emergencyContact?: IUserEmergencyContact;
  language?: string;
  theme?: 'LIGHT' | 'DARK' | 'SYSTEM';
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  createdBy?: string;
}
