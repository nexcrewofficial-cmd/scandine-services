import { UserRole } from '../users/user.enum.js';

export interface AdminLoginDTO {
  email: string;
  passwordHash?: string;
  password?: string;
}

export interface StaffPinLoginDTO {
  venueId: string;
  pinCode: string;
}

export interface RefreshTokenDTO {
  refreshToken: string;
}

export interface DeviceAuthDTO {
  deviceUUID: string;
  phoneNumber?: string;
  venueId?: string;
}

export interface RegisterStaffDTO {
  venueId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  password?: string;
  pinCode: string;
  role: UserRole;
  hourlyRate?: number;
}

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
