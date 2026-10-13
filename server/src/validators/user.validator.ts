import { z } from 'zod';
import { objectId } from './auth.validator';

export const createUserSchema = z
  .object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(6).max(128),
    role: z.enum(['manager', 'employee']),
    department: objectId.optional(),
    departments: z.array(objectId).optional(),
    managers: z.array(objectId).optional().default([]),
    employees: z.array(objectId).optional().default([]),
    phone: z.string().max(20).optional().default(''),
    rollNumber: z.string().max(50).optional().default(''),
  })
  .refine(
    (data) => Boolean(data.department || (data.departments && data.departments.length > 0)),
    {
      message: 'At least one department is required',
      path: ['department'],
    }
  );

export const createEmployeeSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  department: objectId.optional(),
  departments: z.array(objectId).optional(),
  managers: z.array(objectId).optional().default([]),
  phone: z.string().max(20).optional().default(''),
  rollNumber: z.string().max(50).optional().default(''),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional(),
  rollNumber: z.string().max(50).optional(),
  avatarUrl: z.string().url().or(z.literal('')).optional(),
  department: objectId.optional().nullable(),
  departments: z.array(objectId).optional(),
  managers: z.array(objectId).optional(),
  employees: z.array(objectId).optional(),
  role: z.enum(['manager', 'employee']).optional(),
  password: z.string().min(6).max(128).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(128),
});

export const userStatusSchema = z.object({
  isActive: z.boolean(),
});
