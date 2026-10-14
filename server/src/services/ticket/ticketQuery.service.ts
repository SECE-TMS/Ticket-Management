import Ticket from '../../models/Ticket';
import ActivityLog from '../../models/ActivityLog';
import Notification from '../../models/Notification';
import type { IUserDocument } from '../../models/User';
import ApiError from '../../utils/apiError';
import { assertTicketAccess, buildListFilter, populateTicket } from './ticketCommon';

export const listTickets = async (actor: IUserDocument, query: Record<string, unknown>) => {
  const filter = buildListFilter(actor, query);
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    populateTicket(Ticket.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)),
    Ticket.countDocuments(filter),
  ]);

  return {
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  };
};

export const getTicketById = async (id: string, actor: IUserDocument) => {
  const ticket = await populateTicket(Ticket.findById(id));
  if (!ticket) throw ApiError.notFound('Ticket not found');
  assertTicketAccess(ticket, actor);

  if (
    ticket.resolution &&
    (ticket.resolution.attachment?.url || (ticket.resolution.attachments && ticket.resolution.attachments.length > 0) || ticket.resolution.remarks) &&
    (!ticket.resolutionHistory || ticket.resolutionHistory.length === 0)
  ) {
    ticket.resolutionHistory = [
      {
        remarks: ticket.resolution.remarks || 'Completed',
        attachment: ticket.resolution.attachment || null,
        attachments: ticket.resolution.attachments || [],
        resolvedAt: ticket.resolution.resolvedAt || ticket.updatedAt || ticket.createdAt,
        resolvedBy: ticket.assignedTo as any,
        actionType: 'resolved',
        createdAt: ticket.resolution.resolvedAt || ticket.updatedAt || ticket.createdAt,
      } as any,
    ];
    void Ticket.findByIdAndUpdate(ticket._id, { resolutionHistory: ticket.resolutionHistory }).exec();
  }

  const activities = await ActivityLog.find({ ticket: ticket._id })
    .populate('actor', 'name role')
    .sort({ createdAt: -1 })
    .lean();

  return { ticket, activities };
};

export const deleteTicket = async (id: string, actor: IUserDocument) => {
  if (actor.role !== 'admin') {
    throw ApiError.forbidden('Only administrators can permanently delete tickets');
  }

  const ticket = await Ticket.findById(id);
  if (!ticket) throw ApiError.notFound('Ticket not found');

  await Promise.all([
    ActivityLog.deleteMany({ ticket: ticket._id }),
    Notification.deleteMany({ ticket: ticket._id }),
    Ticket.findByIdAndDelete(ticket._id),
  ]);

  return { message: `Ticket ${ticket.ticketCode} deleted permanently`, ticketCode: ticket.ticketCode };
};
