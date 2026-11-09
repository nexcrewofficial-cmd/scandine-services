import mongoose, { Schema, Document } from 'mongoose';
import { IUser, UserRole, Gender, EmploymentType } from '@scan-and-dine/shared-types';

export interface IUserDocument extends Omit<IUser, '_id'>, Document {}

const UserSchema = new Schema<IUserDocument>(
  {
    venueId: {
      type: Schema.Types.ObjectId,
      ref: 'Venue',
      default: null,
      index: true,
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phoneNumber: { type: String, trim: true },
    avatarUrl: { type: String },
    dateOfBirth: { type: Date },
    gender: {
      type: String,
      enum: Object.values(Gender),
      default: Gender.PREFER_NOT_TO_SAY,
    },
    passwordHash: { type: String },
    pinCodeHash: { type: String }, // For 4-digit POS / KDS staff PIN login
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
    lastLoginAt: { type: Date },
    failedLoginAttempts: { type: Number, default: 0 },
    accountLockedUntil: { type: Date },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
      index: true,
    },
    customPermissions: [{ type: String }],
    employeeId: { type: String },
    hireDate: { type: Date },
    employmentType: {
      type: String,
      enum: Object.values(EmploymentType),
      default: EmploymentType.FULL_TIME,
    },
    hourlyRate: { type: Number, default: 0 },
    emergencyContact: {
      name: { type: String },
      phone: { type: String },
      relation: { type: String },
    },
    language: { type: String, default: 'en' },
    theme: { type: String, enum: ['LIGHT', 'DARK', 'SYSTEM'], default: 'SYSTEM' },
    isActive: { type: Boolean, default: true, index: true },
    deletedAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

// Compound Index: Enforce unique email per venue (or globally for Super Admin)
UserSchema.index({ venueId: 1, email: 1 }, { unique: true });
UserSchema.index({ venueId: 1, role: 1 });

export const UserModel = mongoose.model<IUserDocument>('User', UserSchema);
