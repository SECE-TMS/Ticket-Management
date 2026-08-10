import { z } from 'zod';
import { objectId } from './auth.validator';

export const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  role: z.enum(['manager', 'employee']),
  department: objectId,
  phone: z.string().max(20).optional().default(''),
});

export const createEmployeeSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  phone: z.string().max(20).optional().default(''),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional(),
  avatarUrl: z.string().url().or(z.literal('')).optional(),
  department: objectId.optional().nullable(),
  role: z.enum(['manager', 'employee']).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(128),
});

export const userStatusSchema = z.object({
  isActive: z.boolean(),
});
