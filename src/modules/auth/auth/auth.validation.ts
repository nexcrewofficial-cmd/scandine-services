import { z } from 'zod';

export const adminLoginSchema = z.object({
  email: z.string().email('Valid email address required'),
  password: z.string().min(1, 'Password is required'),
});

export const staffPinLoginSchema = z.object({
  venueId: z.string().min(1, 'Venue ID is required'),
  pinCode: z.string().length(4, 'PIN must be exactly 4 digits'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
