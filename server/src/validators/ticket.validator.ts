import { z } from 'zod';
import { objectId } from './auth.validator';
import { PRIORITIES, STATUSES } from '../models/Ticket';

export const createTicketSchema = z.object({
  name: z.string().min(2).max(100),
  mobile: z.string().min(7).max(20),
  email: z.string().email().optional().or(z.literal('')),
  department: objectId,
  complaintType: z.string().min(1).max(100),
  description: z.string().min(5).max(5000),
  priority: z.enum(PRIORITIES).optional().default('medium'),
});

export const trackTicketSchema = z.object({
  ticketCode: z.string().min(5),
  mobile: z.string().min(7).max(20),
});

export const assignTicketSchema = z.object({
  assignedTo: objectId,
  priority: z.enum(PRIORITIES).optional(),
});

export const reassignTicketSchema = z.object({
  assignedTo: objectId,
  message: z.string().max(500).optional(),
});

export const statusUpdateSchema = z.object({
  status: z.enum(['accepted', 'in_progress']),
  message: z.string().max(500).optional(),
});

export const resolveTicketSchema = z.object({
  remarks: z.string().min(3).max(2000),
});

export const commentSchema = z.object({
  message: z.string().min(1).max(2000),
});

export const listTicketsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  department: objectId.optional(),
  assignedTo: objectId.optional(),
  search: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});
