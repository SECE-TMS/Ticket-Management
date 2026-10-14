import Ticket from '../../models/Ticket';
import Department from '../../models/Department';
import type { IUserDocument } from '../../models/User';
import ApiError from '../../utils/apiError';
import { logActivity, notifyMany } from '../activity.service';
import { notifyRequesterOnAction } from './ticketNotification.service';
import { assertTicketAccess, populateTicket } from './ticketCommon';

export const addComment = async (
  id: string,
  { message }: { message: string },
  actor: IUserDocument
) => {
  const ticket = await Ticket.findById(id);
  if (!ticket) throw ApiError.notFound('Ticket not found');
  assertTicketAccess(ticket, actor);

  ticket.comments.push({ author: actor._id, message, createdAt: new Date() });
  await ticket.save();

  await logActivity({
    ticket,
    actor,
    action: 'commented',
    message,
  });

  const dept = await Department.findById(ticket.department);
  const recipients = [dept?.manager, ticket.assignedTo, ticket.assignedBy].filter(
    (r) => r && String(r) !== String(actor._id)
  );
  await notifyMany(recipients, {
    ticket,
    type: 'comment_added',
    message: `New comment on ${ticket.ticketCode}`,
  });

  void notifyRequesterOnAction(ticket, 'New Staff Comment Added', `Comment: "${message}"`, 'commented');

  return populateTicket(Ticket.findById(ticket._id));
};
