import { z } from 'zod';
import { objectId } from './auth.validator';

export const createDepartmentSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional().default(''),
  manager: objectId.optional().nullable(),
  complaintTypes: z.array(z.string().min(1)).optional().default([]),
  slaHours: z.coerce.number().int().min(1).max(720).optional().default(48),
  isActive: z.boolean().optional().default(true),
});

export const updateDepartmentSchema = createDepartmentSchema.partial();

export const statusSchema = z.object({
  isActive: z.boolean(),
});
