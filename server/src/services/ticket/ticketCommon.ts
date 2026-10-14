import { type Query } from 'mongoose';
import Ticket, { OPEN_STATUSES, type ITicket, type ITicketDocument, type TicketStatus, type TicketPriority } from '../../models/Ticket';
import { getUserDepartmentIds, type IUserDocument } from '../../models/User';
import ApiError from '../../utils/apiError';

export type TicketQuery = Query<ITicket | ITicket[] | null, ITicket>;

export const populateTicket = <T extends TicketQuery>(query: T): T =>
  query
    .populate('department', 'name complaintTypes slaHours')
    .populate('assignedTo', 'name email phone')
    .populate('assignedBy', 'name email')
    .populate('closedBy', 'name email')
    .populate('comments.author', 'name email role')
    .populate('resolutionHistory.resolvedBy', 'name email role') as T;

export const assertTicketAccess = (
  ticket: ITicket & { department: unknown; assignedTo?: unknown },
  actor?: IUserDocument
) => {
  if (!actor) return;
  if (actor.role === 'admin') return;

  const dept = ticket.department as { _id?: unknown } | unknown;
  const deptId = String(
    dept && typeof dept === 'object' && '_id' in (dept as object)
      ? (dept as { _id: unknown })._id
      : ticket.department
  );

  if (actor.role === 'manager') {
    const managerDepts = getUserDepartmentIds(actor);
    if (!managerDepts.includes(deptId)) throw ApiError.forbidden('Access limited to your department(s)');
    return;
  }

  if (actor.role === 'employee') {
    const assigned = ticket.assignedTo as { _id?: unknown } | unknown;
    const assignedId = assigned
      ? String(
          assigned && typeof assigned === 'object' && '_id' in (assigned as object)
            ? (assigned as { _id: unknown })._id
            : assigned
        )
      : null;
    if (!ticket.assignedTo || assignedId !== String(actor._id)) {
      throw ApiError.forbidden('You can only access tickets assigned to you');
    }
  }
};

export const buildListFilter = (actor: IUserDocument, query: Record<string, unknown>) => {
  const filter: Record<string, unknown> = {};

  if (actor.role === 'manager') {
    const managerDepts = getUserDepartmentIds(actor);
    const deptQuery =
      query.department && query.department !== 'all' && query.department !== '' && query.department !== 'undefined'
        ? String(query.department)
        : null;
    if (deptQuery) {
      if (!managerDepts.includes(deptQuery)) {
        throw ApiError.forbidden('Cannot filter outside your department(s)');
      }
      filter.department = deptQuery;
    } else {
      filter.department = managerDepts.length === 1 ? managerDepts[0] : { $in: managerDepts };
    }
  } else if (actor.role === 'employee') {
    filter.assignedTo = actor._id;
  } else if (query.department && query.department !== 'all' && query.department !== '' && query.department !== 'undefined') {
    filter.department = query.department;
  }

  if (query.status === 'active') {
    filter.status = { $ne: 'closed' };
  } else if (query.status && query.status !== 'all' && query.status !== '' && query.status !== 'undefined') {
    filter.status = query.status;
  }
  if (query.priority && query.priority !== 'all' && query.priority !== '' && query.priority !== 'undefined') {
    filter.priority = query.priority;
  }
  if (
    query.assignedTo &&
    query.assignedTo !== 'all' &&
    query.assignedTo !== '' &&
    query.assignedTo !== 'undefined' &&
    actor.role !== 'employee'
  ) {
    filter.assignedTo = query.assignedTo;
  }

  const fromVal = query.from || query.startDate;
  const toVal = query.to || query.endDate;
  if (fromVal || toVal) {
    const createdAt: Record<string, Date> = {};
    if (fromVal && String(fromVal).trim() !== '' && String(fromVal) !== 'undefined' && String(fromVal) !== 'null') {
      const fromD = new Date(String(fromVal));
      if (!isNaN(fromD.getTime())) {
        if (String(fromVal).length <= 10) {
          fromD.setHours(0, 0, 0, 0);
        }
        createdAt.$gte = fromD;
      }
    }
    if (toVal && String(toVal).trim() !== '' && String(toVal) !== 'undefined' && String(toVal) !== 'null') {
      const toD = new Date(String(toVal));
      if (!isNaN(toD.getTime())) {
        if (String(toVal).length <= 10) {
          toD.setHours(23, 59, 59, 999);
        }
        createdAt.$lte = toD;
      }
    }
    if (Object.keys(createdAt).length > 0) {
      filter.createdAt = createdAt;
    }
  }

  if (query.search && String(query.search).trim() !== '' && query.search !== 'undefined') {
    const s = String(query.search).trim();
    filter.$or = [
      { ticketCode: { $regex: s, $options: 'i' } },
      { title: { $regex: s, $options: 'i' } },
      { 'requester.name': { $regex: s, $options: 'i' } },
      { 'requester.mobile': { $regex: s, $options: 'i' } },
      { 'requester.rollNumber': { $regex: s, $options: 'i' } },
      { complaintType: { $regex: s, $options: 'i' } },
      { description: { $regex: s, $options: 'i' } },
    ];
  }

  return filter;
};

export const formatDuration = (ms: number): string => {
  if (ms < 0) return '0m';
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);
  return parts.join(' ');
};

export const getTicketDuration = (ticket: ITicket): string => {
  if (!ticket.createdAt) return '—';
  const start = new Date(ticket.createdAt).getTime();
  const end = ticket.closedAt
    ? new Date(ticket.closedAt).getTime()
    : ticket.resolution?.resolvedAt
    ? new Date(ticket.resolution.resolvedAt).getTime()
    : Date.now();
  const dur = formatDuration(end - start);
  if (ticket.status === 'closed' || ticket.status === 'resolved') {
    return dur;
  }
  return `${dur} (open)`;
};

export { OPEN_STATUSES, Ticket };
export type { ITicket, ITicketDocument, TicketStatus, TicketPriority };
