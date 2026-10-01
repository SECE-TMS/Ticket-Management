import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import connectDB from '../config/db';
import User from '../models/User';
import logger from '../utils/logger';

const SUPERADMIN_DATA = {
  name: 'Super Admin',
  email: 'superadmin@sece.ac.in',
  password: 'SuperAdmin@123',
  role: 'superadmin' as const,
  phone: '9999999990',
  isActive: true,
};

async function seedSuperAdmin() {
  await connectDB();

  logger.info('Checking for existing superadmin user...');
  let user = await User.findOne({ email: SUPERADMIN_DATA.email }).select('+password');

  if (user) {
    logger.info(`Found existing superadmin (${user.email}). Updating credentials and role...`);
    user.name = SUPERADMIN_DATA.name;
    user.password = SUPERADMIN_DATA.password;
    user.role = 'superadmin';
    user.isActive = true;
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();
    logger.info('✓ Superadmin user successfully updated!');
  } else {
    logger.info('Creating new superadmin user...');
    user = await User.create(SUPERADMIN_DATA);
    logger.info('✓ Superadmin user successfully created!');
  }

  console.log('\n==================================================');
  console.log('         SUPER ADMIN CREDENTIALS                  ');
  console.log('==================================================');
  console.log(`Role     : superadmin`);
  console.log(`Email    : ${SUPERADMIN_DATA.email}`);
  console.log(`Password : ${SUPERADMIN_DATA.password}`);
  console.log('==================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

seedSuperAdmin().catch((err) => {
  logger.error('Failed to seed superadmin', err);
  process.exit(1);
});
