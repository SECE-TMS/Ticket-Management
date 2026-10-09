import { z } from 'zod';
import { objectId } from './auth.validator';

export const createTaskSchema = z.object({
  title: z.string().min(2, 'Task title is required').max(200),
  description: z.string().min(2, 'Task description/instructions required').max(5000),
  department: objectId,
  assignedTo: objectId,
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  dueDate: z.string().datetime().or(z.string().min(1)).optional().nullable(),
  relatedTicket: objectId.optional().nullable(),
  checklist: z
    .array(
      z.object({
        title: z.string().min(1, 'Checklist item cannot be empty'),
        completed: z.boolean().default(false),
      })
    )
    .optional()
    .default([]),
  notificationPreferences: z
    .object({
      inApp: z.boolean().default(true),
      email: z.boolean().default(true),
      sms: z.boolean().default(true),
    })
    .optional()
    .default({ inApp: true, email: true, sms: true }),
});

export const updateTaskSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().min(2).max(5000).optional(),
  department: objectId.optional(),
  assignedTo: objectId.optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().datetime().or(z.string().min(1)).optional().nullable(),
  relatedTicket: objectId.optional().nullable(),
  checklist: z
    .array(
      z.object({
        _id: z.string().optional(),
        title: z.string().min(1),
        completed: z.boolean().default(false),
      })
    )
    .optional(),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  completionRemarks: z.string().max(2000).optional(),
  cancelledReason: z.string().max(1000).optional(),
});

export const toggleChecklistItemSchema = z.object({
  completed: z.boolean(),
});
