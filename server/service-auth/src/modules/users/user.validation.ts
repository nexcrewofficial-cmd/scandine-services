import { z } from 'zod';
import { UserRole, EmploymentType } from '@scan-and-dine/shared-types';

export const createStaffSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().optional(),
  password: z.string().min(6).optional(),
  pinCode: z.string().length(4, 'PIN must be exactly 4 digits'),
  role: z.nativeEnum(UserRole),
  employeeId: z.string().optional(),
  hourlyRate: z.number().min(0).optional(),
  employmentType: z.nativeEnum(EmploymentType).optional(),
});

export const updateStaffSchema = createStaffSchema.partial();
