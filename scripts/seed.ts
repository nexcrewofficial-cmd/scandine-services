import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

import { UserModel } from '../src/modules/auth/users/user.model.js';
import { VenueModel } from '../src/modules/menu/venues/venue.model.js';
import { UserRole, EmploymentType, OperatingMode, SubscriptionTier, SubscriptionStatus } from '@scan-and-dine/shared-types';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/scan-and-dine';

async function seed() {
  console.log('🌱 Connecting to MongoDB at:', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB.');

  // 1. Create or Find Default Venue
  let venue = await VenueModel.findOne({ slug: 'pizza-palace' });
  if (!venue) {
    venue = await VenueModel.create({
      name: 'Pizza Palace Downtown',
      slug: 'pizza-palace',
      description: 'Authentic stone-baked artisan pizza and craft beverages.',
      contactEmail: 'contact@pizzapalace.com',
      contactPhone: '+1-555-0199',
      timezone: 'America/New_York',
      operatingMode: OperatingMode.DINE_IN,
      subscriptionTier: SubscriptionTier.PREMIUM,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      featureFlags: {
        hasScanToOrder: true,
        hasWaiterApp: true,
        hasKDS: true,
        hasPOSIntegration: true,
      },
      settings: {
        taxRate: 8.5,
        currency: 'USD',
        autoAcceptOrders: true,
        allowCashPayments: true,
        geofenceRadiusMeters: 300,
      },
    });
    console.log('🏪 Created default venue: Pizza Palace Downtown (ID:', venue._id.toString(), ')');
  } else {
    console.log('🏪 Using existing venue: Pizza Palace Downtown (ID:', venue._id.toString(), ')');
  }

  const venueId = venue._id;

  // 2. Prepare Sample Staff and Users
  const usersToSeed = [
    {
      firstName: 'Alice',
      lastName: 'Owner',
      email: 'admin@pizzapalace.com',
      password: 'AdminPassword123!',
      role: UserRole.VENUE_ADMIN,
      pinCode: '9999',
      employeeId: 'ADM-001',
    },
    {
      firstName: 'Marcus',
      lastName: 'Manager',
      email: 'manager@pizzapalace.com',
      password: 'ManagerPassword123!',
      role: UserRole.MANAGER,
      pinCode: '1111',
      employeeId: 'MGR-001',
    },
    {
      firstName: 'David',
      lastName: 'Waiter',
      email: 'waiter@pizzapalace.com',
      password: 'StaffPassword123!',
      role: UserRole.WAITER,
      pinCode: '2222',
      employeeId: 'WTR-001',
    },
    {
      firstName: 'Gordon',
      lastName: 'Chef',
      email: 'kitchen@pizzapalace.com',
      password: 'StaffPassword123!',
      role: UserRole.KITCHEN_STAFF,
      pinCode: '3333',
      employeeId: 'KIT-001',
    },
    {
      firstName: 'Chloe',
      lastName: 'Cashier',
      email: 'cashier@pizzapalace.com',
      password: 'StaffPassword123!',
      role: UserRole.CASHIER,
      pinCode: '4444',
      employeeId: 'CSH-001',
    },
  ];

  console.log('\n👥 Seeding users & staff credentials...');

  for (const item of usersToSeed) {
    const passwordHash = await bcrypt.hash(item.password, 10);
    const pinCodeHash = await bcrypt.hash(item.pinCode, 10);

    const userDoc = await UserModel.findOneAndUpdate(
      { email: item.email.toLowerCase() },
      {
        venueId,
        firstName: item.firstName,
        lastName: item.lastName,
        email: item.email.toLowerCase(),
        passwordHash,
        pinCodeHash,
        role: item.role,
        employeeId: item.employeeId,
        employmentType: EmploymentType.FULL_TIME,
        isActive: true,
        failedLoginAttempts: 0,
        accountLockedUntil: undefined,
        deletedAt: null,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`  ✓ ${item.role.padEnd(14)} : ${item.email} (PIN: ${item.pinCode})`);
  }

  console.log('\n=============================================================');
  console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
  console.log('=============================================================');
  console.log(`Venue ID: ${venueId.toString()}`);
  console.log('Slug    : pizza-palace');
  console.log('-------------------------------------------------------------');
  console.log('1. Admin Login (/api/v1/auth/admin/login):');
  console.log('   Email   : admin@pizzapalace.com');
  console.log('   Password: AdminPassword123!');
  console.log('-------------------------------------------------------------');
  console.log('2. Staff PIN Login (/api/v1/auth/staff/login):');
  console.log(`   Venue ID: ${venueId.toString()}`);
  console.log('   Manager : PIN 1111  (manager@pizzapalace.com)');
  console.log('   Waiter  : PIN 2222  (waiter@pizzapalace.com)');
  console.log('   Kitchen : PIN 3333  (kitchen@pizzapalace.com)');
  console.log('   Cashier : PIN 4444  (cashier@pizzapalace.com)');
  console.log('=============================================================\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
