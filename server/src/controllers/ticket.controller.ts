import type { Response, NextFunction } from 'express';
import * as ticketService from '../services/ticket.service';
import { sendSuccess } from '../utils/apiResponse';
import type { AuthRequest } from '../types/auth';

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const files = (req.files as Express.Multer.File[]) || (req.file ? [req.file] : []);
    const data = await ticketService.createPublicTicket(req.body, req.file, files);
    return sendSuccess(res, { statusCode: 201, data, message: 'Ticket created' });
  } catch (err) {
    next(err);
  }
};

export const track = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await ticketService.trackTicket(req.query as { ticketCode: string; mobile: string });
    return sendSuccess(res, { data });
  } catch (err) {
    next(err);
  }
};

export const list = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await ticketService.listTickets(req.user!, req.query as Record<string, unknown>);
    return sendSuccess(res, { data });
  } catch (err) {
    next(err);
  }
};

export const getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await ticketService.getTicketById(req.params.id, req.user!);
    return sendSuccess(res, { data });
  } catch (err) {
    next(err);
  }
};

export const assign = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await ticketService.assignTicket(req.params.id, req.body, req.user!);
    return sendSuccess(res, { data, message: 'Ticket assigned' });
  } catch (err) {
    next(err);
  }
};

export const reassign = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await ticketService.reassignTicket(req.params.id, req.body, req.user!);
    return sendSuccess(res, { data, message: 'Ticket reassigned' });
  } catch (err) {
    next(err);
  }
};

export const updateStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await ticketService.updateStatus(req.params.id, req.body, req.user!);
    return sendSuccess(res, { data, message: 'Status updated' });
  } catch (err) {
    next(err);
  }
};

export const resolve = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const files = (req.files as Express.Multer.File[]) || (req.file ? [req.file] : []);
    const data = await ticketService.resolveTicket(req.params.id, req.body, req.file, files, req.user!);
    return sendSuccess(res, { data, message: 'Ticket resolved' });
  } catch (err) {
    next(err);
  }
};

export const close = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await ticketService.closeTicket(req.params.id, req.user!);
    return sendSuccess(res, { data, message: 'Ticket closed' });
  } catch (err) {
    next(err);
  }
};

export const reopen = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await ticketService.reopenTicket(req.params.id, req.user!, req.body?.message);
    return sendSuccess(res, { data, message: 'Ticket reopened' });
  } catch (err) {
    next(err);
  }
};

export const comment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await ticketService.addComment(req.params.id, req.body, req.user!);
    return sendSuccess(res, { data, message: 'Comment added' });
  } catch (err) {
    next(err);
  }
};

export const exportCsv = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const csv = await ticketService.exportCsv(req.user!, req.query as Record<string, unknown>);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="tickets.csv"');
    return res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
};
