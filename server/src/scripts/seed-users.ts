import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const { ObjectId } = mongoose.Types;

const rawUsers = [
  {
    _id: new ObjectId('6a8952ef25be2bfafff0a004'),
    name: 'System Admin',
    email: 'admin@sece.ac.in',
    password: '$2a$12$Hb6shoNuMXp1BfnW4mMYe.UQbS70nXGf0fd8pRfvmhIfwihnKRHtS',
    role: 'admin',
    department: null,
    phone: '9999999999',
    rollNumber: '',
    avatarUrl: '',
    isActive: true,
    lastLogin: new Date('2026-09-23T11:15:30.334Z'),
    createdBy: null,
    refreshToken:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YTg5NTJlZjI1YmUyYmZhZmZmMGEwMDQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3OTAxNjIxMzAsImV4cCI6MTc5MDc2NjkzMH0.btD6zxBBRmCetc8YHBDXgsspV2UqvEq_4qDjJuGaRKA',
    passwordResetToken: null,
    passwordResetExpires: null,
    loginAttempts: 0,
    lockUntil: null,
    createdAt: new Date('2026-08-22T07:42:39.653Z'),
    updatedAt: new Date('2026-09-23T11:15:30.335Z'),
    __v: 0,
  },
  {
    _id: new ObjectId('6aa8dfce32acc0af3a03dfd1'),
    name: 'Girija',
    email: 'girija.s@sece.ac.in',
    password: '$2a$12$A0af./.qiMmkFV.hu.2Tb.UM/tq54crsFr2u2.PwRDRtFqLMaHJpK',
    role: 'manager',
    department: new ObjectId('6aa8df9232acc0af3a03dfc5'),
    phone: '',
    rollNumber: '',
    avatarUrl: '',
    isActive: true,
    lastLogin: new Date('2026-09-15T10:26:01.192Z'),
    createdBy: new ObjectId('6a8952ef25be2bfafff0a004'),
    refreshToken:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YWE4ZGZjZTMyYWNjMGFmM2EwM2RmZDEiLCJyb2xlIjoibWFuYWdlciIsImlhdCI6MTc4OTQ2Nzk2MSwiZXhwIjoxNzkwMDcyNzYxfQ.M6mcd9xXuXzBsmVIIEXY9Fbgz-qiUm9oFEC6b4p0qoM',
    passwordResetToken: null,
    passwordResetExpires: null,
    loginAttempts: 0,
    lockUntil: null,
    createdAt: new Date('2026-09-15T06:03:58.751Z'),
    updatedAt: new Date('2026-09-15T10:26:01.192Z'),
    __v: 0,
  },
  {
    _id: new ObjectId('6aa8e22e32acc0af3a03e04e'),
    name: 'Anand',
    email: 'anand.p@sece.ac.in',
    password: '$2a$12$zHD7gR9e31kXYMF8f44Kr.zpAXm3j/OG1S2Jxy8K7oQs3FElXdNH2',
    role: 'employee',
    department: new ObjectId('6aa8df9232acc0af3a03dfc5'),
    phone: '',
    rollNumber: '',
    avatarUrl: '',
    isActive: true,
    lastLogin: new Date('2026-09-17T05:00:00.455Z'),
    createdBy: new ObjectId('6aa8dfce32acc0af3a03dfd1'),
    refreshToken: null,
    passwordResetToken: null,
    passwordResetExpires: null,
    loginAttempts: 0,
    lockUntil: null,
    createdAt: new Date('2026-09-15T06:14:06.180Z'),
    updatedAt: new Date('2026-09-17T05:04:39.507Z'),
    __v: 0,
  },
  {
    _id: new ObjectId('6aa9080d8faa81606b1c1ad2'),
    name: 'Vishwanathan',
    email: 'systemadmin@sece.ac.in',
    password: '$2a$12$4joYqOZwGz6sakAkE96MnuQm9lDjcKT8YnKkFta7fxBk2uTRjbZbm',
    role: 'manager',
    department: new ObjectId('6a8952f025be2bfafff0a012'),
    phone: '',
    rollNumber: '',
    avatarUrl: '',
    isActive: true,
    lastLogin: new Date('2026-09-15T08:56:57.388Z'),
    createdBy: new ObjectId('6a8952ef25be2bfafff0a004'),
    refreshToken: null,
    passwordResetToken: null,
    passwordResetExpires: null,
    loginAttempts: 0,
    lockUntil: null,
    createdAt: new Date('2026-09-15T08:55:41.612Z'),
    updatedAt: new Date('2026-09-15T09:01:06.622Z'),
    __v: 0,
  },
  {
    _id: new ObjectId('6aa9083e8faa81606b1c1ae1'),
    name: 'Prakash',
    email: 'systemadmin1@sece.ac.in',
    password: '$2a$12$3ppUeTukLoL0ulb/qnjwAOS/CaAUJ3V0mGDHdvhn40of5TbeNVkJ2',
    role: 'employee',
    department: new ObjectId('6a8952f025be2bfafff0a012'),
    phone: '',
    rollNumber: '',
    avatarUrl: '',
    isActive: true,
    lastLogin: new Date('2026-09-15T09:02:09.089Z'),
    createdBy: new ObjectId('6a8952ef25be2bfafff0a004'),
    refreshToken: null,
    passwordResetToken: null,
    passwordResetExpires: null,
    loginAttempts: 0,
    lockUntil: null,
    createdAt: new Date('2026-09-15T08:56:30.523Z'),
    updatedAt: new Date('2026-09-15T09:12:15.143Z'),
    __v: 0,
  },
  {
    _id: new ObjectId('6aa908da8faa81606b1c1b00'),
    name: 'vignesh',
    email: 'systemadmin2@sece.ac.in',
    password: '$2a$12$zYp2a1S/JEHidAbKOKEw1enFAaEqL8fzTn54OtaV9QSEpVwxi444m',
    role: 'employee',
    department: new ObjectId('6a8952f025be2bfafff0a012'),
    phone: '',
    rollNumber: '',
    avatarUrl: '',
    isActive: true,
    lastLogin: null,
    createdBy: new ObjectId('6aa9080d8faa81606b1c1ad2'),
    refreshToken: null,
    passwordResetToken: null,
    passwordResetExpires: null,
    loginAttempts: 0,
    lockUntil: null,
    createdAt: new Date('2026-09-15T08:59:06.129Z'),
    updatedAt: new Date('2026-09-15T08:59:06.129Z'),
    __v: 0,
  },
  {
    _id: new ObjectId('6aa910958faa81606b1c1cc8'),
    name: 'Mohankumar',
    email: 'mohankumar.m@sece.ac.in',
    password: '$2a$12$560oApg4mFTWarlpLIVOtO2q8UqtCz9XWonfHNi4GYaI7lSvxJwFG',
    role: 'manager',
    department: new ObjectId('6a8952f025be2bfafff0a010'),
    phone: '9994300025',
    rollNumber: 'SECETEC002',
    avatarUrl: '',
    isActive: true,
    lastLogin: new Date('2026-09-15T09:38:49.589Z'),
    createdBy: new ObjectId('6a8952ef25be2bfafff0a004'),
    refreshToken: null,
    passwordResetToken: null,
    passwordResetExpires: null,
    loginAttempts: 0,
    lockUntil: null,
    createdAt: new Date('2026-09-15T09:32:05.234Z'),
    updatedAt: new Date('2026-09-15T09:43:01.306Z'),
    __v: 0,
  },
  {
    _id: new ObjectId('6aa910f28faa81606b1c1cd7'),
    name: 'PRAKASH',
    email: 'supervisor@sece.ac.in',
    password: '$2a$12$F.ex0wWfqhAr3YBABbN09OqYGWnc/RAfiCJcrkOsqgpsCWNTHAz1S',
    role: 'employee',
    department: new ObjectId('6a8952f025be2bfafff0a010'),
    phone: '',
    rollNumber: '',
    avatarUrl: '',
    isActive: true,
    lastLogin: null,
    createdBy: new ObjectId('6a8952ef25be2bfafff0a004'),
    refreshToken: null,
    passwordResetToken: null,
    passwordResetExpires: null,
    loginAttempts: 0,
    lockUntil: new Date('2026-09-15T10:01:54.693Z'),
    createdAt: new Date('2026-09-15T09:33:38.038Z'),
    updatedAt: new Date('2026-09-15T09:46:54.693Z'),
    __v: 0,
  },
  {
    _id: new ObjectId('6aa912b68faa81606b1c1d25'),
    name: 'Thilagamani',
    email: 'supervisor1@sece.ac.in',
    password: '$2a$12$pLG/RcOTXyC5BllQd6ozNOCiEWKL2a7Ux/mffP4xgtpLC6wqJ6P0C',
    role: 'employee',
    department: new ObjectId('6a8952f025be2bfafff0a010'),
    phone: '',
    rollNumber: '',
    avatarUrl: '',
    isActive: true,
    lastLogin: null,
    createdBy: new ObjectId('6aa910958faa81606b1c1cc8'),
    refreshToken: null,
    passwordResetToken: null,
    passwordResetExpires: null,
    loginAttempts: 0,
    lockUntil: null,
    createdAt: new Date('2026-09-15T09:41:10.076Z'),
    updatedAt: new Date('2026-09-15T09:41:10.076Z'),
    __v: 0,
  },
];

const mediaDept = {
  _id: new ObjectId('6aa8df9232acc0af3a03dfc5'),
  name: 'Media',
  description: 'Posters, Flex, Foam Board, Pamphlets',
  manager: new ObjectId('6aa8dfce32acc0af3a03dfd1'),
  complaintTypes: ['Posters', 'Flex', 'Foam Board', 'Pamphlets'],
  slaHours: 48,
  isActive: true,
  createdAt: new Date('2026-09-15T06:02:58.893Z'),
  updatedAt: new Date('2026-09-15T06:04:01.063Z'),
  __v: 0,
};

async function seedUsers(targetUri?: string) {
  const uri = targetUri || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ticket_management_system';
  console.log(`Connecting to: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`);

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  if (!db) throw new Error('Database connection failed');

  // Upsert Media department if not exists
  await db.collection('departments').updateOne(
    { _id: mediaDept._id },
    { $set: mediaDept },
    { upsert: true }
  );
  console.log('✓ Media department verified/upserted');

  // Clean replace users by email / _id to avoid duplicate key conflicts
  for (const user of rawUsers) {
    await db.collection('users').deleteMany({
      $or: [{ _id: user._id }, { email: user.email }],
    });
    await db.collection('users').insertOne(user);
    console.log(`✓ Seeded user: ${user.email} (${user.name}) [${user.role}]`);
  }

  console.log(`\nSuccessfully seeded ${rawUsers.length} users!`);
  await mongoose.disconnect();
}

const target = process.argv[2];
seedUsers(target)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  });
