import { z } from 'zod';
import { objectId } from './auth.validator';

const nullableObjectId = z
  .union([objectId, z.literal(''), z.null()])
  .optional()
  .nullable()
  .transform((val) => {
    if (val === undefined) return undefined;
    if (!val || val === '') return null;
    return val;
  });

export const floorSchema = z.object({
  _id: z.string().optional(),
  floorName: z.string().trim().min(1, 'Floor name is required').max(100),
  defaultAssignee: nullableObjectId,
});

export const blockSchema = z.object({
  _id: z.string().optional(),
  blockName: z.string().trim().min(1, 'Block name is required').max(100),
  floors: z.array(floorSchema).optional().default([]),
});

export const createDepartmentSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional().default(''),
  manager: nullableObjectId,
  defaultAssignee: nullableObjectId,
  complaintTypes: z.array(z.string().min(1)).optional().default([]),
  slaHours: z.coerce.number().int().min(1).max(720).optional().default(48),
  isActive: z.boolean().optional().default(true),
  locationEnabled: z.boolean().optional().default(false),
  blocks: z.array(blockSchema).optional().default([]),
});

export const updateDepartmentSchema = createDepartmentSchema.partial();

export const statusSchema = z.object({
  isActive: z.boolean(),
});

