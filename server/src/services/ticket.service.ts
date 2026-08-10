import type { Query } from 'mongoose';
import Ticket, { OPEN_STATUSES, type ITicket, type TicketStatus } from '../models/Ticket';
import Department from '../models/Department';
import User, { type IUserDocument } from '../models/User';
import ActivityLog from '../models/ActivityLog';
import ApiError from '../utils/apiError';
import generateTicketCode from '../utils/generateTicketCode';
import { uploadBuffer, type UploadableFile } from '../utils/upload';
import { logActivity, notify, notifyMany } from './activity.service';

type TicketQuery = Query<ITicket | ITicket[] | null, ITicket>;

const populateTicket = <T extends TicketQuery>(query: T): T =>
  query
    .populate('department', 'name complaintTypes slaHours')
    .populate('assignedTo', 'name email phone')
    .populate('assignedBy', 'name email')
    .populate('closedBy', 'name email')
    .populate('comments.author', 'name email role') as T;

const assertTicketAccess = (ticket: ITicket & { department: unknown; assignedTo?: unknown }, actor?: IUserDocument) => {
  if (!actor) return;
  if (actor.role === 'admin') return;

  const dept = ticket.department as { _id?: unknown } | unknown;
  const deptId = String(
    dept && typeof dept === 'object' && '_id' in (dept as object)
      ? (dept as { _id: unknown })._id
      : ticket.department
  );

  if (actor.role === 'manager') {
    const userDept = actor.department ? String(actor.department) : null;
    if (userDept !== deptId) throw ApiError.forbidden('Access limited to your department');
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

const buildListFilter = (actor: IUserDocument, query: Record<string, unknown>) => {
  const filter: Record<string, unknown> = {};

  if (actor.role === 'manager') {
    filter.department = actor.department;
  } else if (actor.role === 'employee') {
    filter.assignedTo = actor._id;
  } else if (query.department) {
    filter.department = query.department;
  }

  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.assignedTo && actor.role !== 'employee') filter.assignedTo = query.assignedTo;

  if (query.from || query.to) {
    const createdAt: Record<string, Date> = {};
    if (query.from) createdAt.$gte = new Date(String(query.from));
    if (query.to) createdAt.$lte = new Date(String(query.to));
    filter.createdAt = createdAt;
  }

  if (query.search) {
    filter.$or = [
      { ticketCode: { $regex: query.search, $options: 'i' } },
      { 'requester.name': { $regex: query.search, $options: 'i' } },
      { 'requester.mobile': { $regex: query.search, $options: 'i' } },
      { complaintType: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } },
    ];
  }

  return filter;
};

export const createPublicTicket = async (
  body: Record<string, unknown>,
  file?: UploadableFile | Express.Multer.File
) => {
  const department = await Department.findById(body.department as string);
  if (!department || !department.isActive) {
    throw ApiError.badRequest('Invalid or inactive department');
  }

  if (
    department.complaintTypes?.length &&
    !department.complaintTypes.includes(body.complaintType as string)
  ) {
    throw ApiError.badRequest('Invalid complaint type for this department');
  }

  let userAttachment = null;
  if (file) {
    userAttachment = await uploadBuffer(file, 'tms/tickets');
  }

  const ticketCode = await generateTicketCode();
  const expectedResolutionAt = new Date(
    Date.now() + (department.slaHours || 48) * 60 * 60 * 1000
  );

  const ticket = await Ticket.create({
    ticketCode,
    requester: {
      name: body.name as string,
      mobile: body.mobile as string,
      email: (body.email as string) || '',
    },
    department: department._id,
    complaintType: body.complaintType as string,
    description: body.description as string,
    userAttachment,
    priority: (body.priority as string) || 'medium',
    status: 'new',
    expectedResolutionAt,
  });

  await logActivity({
    ticket,
    actor: null,
    action: 'created',
    toStatus: 'new',
    message: `Ticket ${ticketCode} created by ${body.name}`,
  });

  if (department.manager) {
    await notify({
      recipient: department.manager,
      ticket,
      type: 'ticket_created',
      message: `New ticket ${ticketCode} in ${department.name}`,
    });
  }

  return populateTicket(Ticket.findById(ticket._id));
};

export const trackTicket = async ({
  ticketCode,
  mobile,
}: {
  ticketCode: string;
  mobile: string;
}) => {
  const ticket = await populateTicket(
    Ticket.findOne({
      ticketCode: String(ticketCode).trim().toUpperCase(),
      'requester.mobile': mobile,
    })
  );

  if (!ticket) throw ApiError.notFound('Ticket not found');

  const activities = await ActivityLog.find({ ticket: ticket._id })
    .populate('actor', 'name role')
    .sort({ createdAt: 1 })
    .lean();

  return { ticket, activities };
};

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

  const activities = await ActivityLog.find({ ticket: ticket._id })
    .populate('actor', 'name role')
    .sort({ createdAt: -1 })
    .lean();

  return { ticket, activities };
};

export const assignTicket = async (
  id: string,
  { assignedTo, priority }: { assignedTo: string; priority?: string },
  actor: IUserDocument
) => {
  const ticket = await Ticket.findById(id);
  if (!ticket) throw ApiError.notFound('Ticket not found');
  assertTicketAccess(ticket, actor);

  if (!['new', 'reopened', 'assigned'].includes(ticket.status)) {
    throw ApiError.badRequest(`Cannot assign ticket in status "${ticket.status}"`);
  }

  const employee = await User.findById(assignedTo);
  if (!employee || !employee.isActive || employee.role !== 'employee') {
    throw ApiError.badRequest('Assignee must be an active employee');
  }

  if (String(employee.department) !== String(ticket.department)) {
    throw ApiError.badRequest('Employee must belong to the ticket department');
  }

  if (actor.role === 'manager' && String(actor.department) !== String(ticket.department)) {
    throw ApiError.forbidden();
  }

  const fromStatus = ticket.status;
  ticket.assignedTo = employee._id;
  ticket.assignedBy = actor._id;
  ticket.status = 'assigned';
  if (priority) ticket.priority = priority as typeof ticket.priority;
  await ticket.save();

  await logActivity({
    ticket,
    actor,
    action: 'assigned',
    fromStatus,
    toStatus: 'assigned',
    message: `Assigned to ${employee.name}`,
  });

  await notify({
    recipient: employee._id,
    ticket,
    type: 'ticket_assigned',
    message: `Ticket ${ticket.ticketCode} assigned to you`,
  });

  return populateTicket(Ticket.findById(ticket._id));
};

export const reassignTicket = async (
  id: string,
  { assignedTo, message }: { assignedTo: string; message?: string },
  actor: IUserDocument
) => {
  const ticket = await Ticket.findById(id);
  if (!ticket) throw ApiError.notFound('Ticket not found');
  assertTicketAccess(ticket, actor);

  if (!ticket.assignedTo) {
    throw ApiError.badRequest('Ticket is not assigned yet; use assign instead');
  }

  if (['resolved', 'closed'].includes(ticket.status)) {
    throw ApiError.badRequest('Cannot reassign a resolved/closed ticket');
  }

  const employee = await User.findById(assignedTo);
  if (!employee || !employee.isActive || employee.role !== 'employee') {
    throw ApiError.badRequest('Assignee must be an active employee');
  }
  if (String(employee.department) !== String(ticket.department)) {
    throw ApiError.badRequest('Employee must belong to the ticket department');
  }

  const previous = ticket.assignedTo;
  const fromStatus = ticket.status;
  ticket.assignedTo = employee._id;
  ticket.assignedBy = actor._id;
  if (ticket.status === 'accepted' || ticket.status === 'in_progress') {
    ticket.status = 'assigned';
  }
  await ticket.save();

  await logActivity({
    ticket,
    actor,
    action: 'assigned',
    fromStatus,
    toStatus: ticket.status,
    message: message || `Reassigned to ${employee.name}`,
  });

  await notifyMany([previous, employee._id], {
    ticket,
    type: 'ticket_reassigned',
    message: `Ticket ${ticket.ticketCode} reassigned to ${employee.name}`,
  });

  return populateTicket(Ticket.findById(ticket._id));
};

export const updateStatus = async (
  id: string,
  { status, message }: { status: 'accepted' | 'in_progress'; message?: string },
  actor: IUserDocument
) => {
  const ticket = await Ticket.findById(id);
  if (!ticket) throw ApiError.notFound('Ticket not found');
  assertTicketAccess(ticket, actor);

  if (actor.role === 'employee') {
    if (!ticket.assignedTo || String(ticket.assignedTo) !== String(actor._id)) {
      throw ApiError.forbidden();
    }
  }

  const transitions: Record<string, string[]> = {
    assigned: ['accepted'],
    accepted: ['in_progress'],
    reopened: ['accepted', 'in_progress'],
  };

  const allowed = transitions[ticket.status] || [];
  if (!allowed.includes(status)) {
    throw ApiError.badRequest(`Cannot change status from "${ticket.status}" to "${status}"`);
  }

  const fromStatus = ticket.status;
  ticket.status = status;
  await ticket.save();

  await logActivity({
    ticket,
    actor,
    action: 'status_changed',
    fromStatus,
    toStatus: status,
    message: message || `Status changed to ${status}`,
  });

  const dept = await Department.findById(ticket.department);
  if (dept?.manager) {
    await notify({
      recipient: dept.manager,
      ticket,
      type: 'status_changed',
      message: `Ticket ${ticket.ticketCode} is now ${status}`,
    });
  }

  return populateTicket(Ticket.findById(ticket._id));
};

export const resolveTicket = async (
  id: string,
  { remarks }: { remarks: string },
  file: UploadableFile | Express.Multer.File | undefined,
  actor: IUserDocument
) => {
  const ticket = await Ticket.findById(id);
  if (!ticket) throw ApiError.notFound('Ticket not found');
  assertTicketAccess(ticket, actor);

  if (actor.role === 'employee') {
    if (!ticket.assignedTo || String(ticket.assignedTo) !== String(actor._id)) {
      throw ApiError.forbidden();
    }
  }

  if (!['accepted', 'in_progress', 'assigned', 'reopened'].includes(ticket.status)) {
    throw ApiError.badRequest(`Cannot resolve ticket in status "${ticket.status}"`);
  }

  let attachment = null;
  if (file) {
    attachment = await uploadBuffer(file, 'tms/resolutions');
  }

  const fromStatus = ticket.status;
  ticket.status = 'resolved';
  ticket.resolution = {
    remarks,
    attachment,
    resolvedAt: new Date(),
  };
  await ticket.save();

  await logActivity({
    ticket,
    actor,
    action: 'status_changed',
    fromStatus,
    toStatus: 'resolved',
    message: remarks,
  });

  const dept = await Department.findById(ticket.department);
  const recipients = [dept?.manager, ticket.assignedBy].filter(Boolean);
  await notifyMany(recipients, {
    ticket,
    type: 'ticket_resolved',
    message: `Ticket ${ticket.ticketCode} resolved`,
  });

  return populateTicket(Ticket.findById(ticket._id));
};

export const closeTicket = async (id: string, actor: IUserDocument) => {
  const ticket = await Ticket.findById(id);
  if (!ticket) throw ApiError.notFound('Ticket not found');
  assertTicketAccess(ticket, actor);

  if (actor.role === 'employee') {
    throw ApiError.forbidden('Employees cannot close tickets');
  }

  if (ticket.status !== 'resolved') {
    throw ApiError.badRequest('Only resolved tickets can be closed');
  }

  const fromStatus = ticket.status;
  ticket.status = 'closed';
  ticket.closedBy = actor._id;
  ticket.closedAt = new Date();
  await ticket.save();

  await logActivity({
    ticket,
    actor,
    action: 'closed',
    fromStatus,
    toStatus: 'closed',
    message: 'Ticket closed',
  });

  if (ticket.assignedTo) {
    await notify({
      recipient: ticket.assignedTo,
      ticket,
      type: 'ticket_closed',
      message: `Ticket ${ticket.ticketCode} closed`,
    });
  }

  return populateTicket(Ticket.findById(ticket._id));
};

export const reopenTicket = async (id: string, actor: IUserDocument, message?: string) => {
  const ticket = await Ticket.findById(id);
  if (!ticket) throw ApiError.notFound('Ticket not found');
  assertTicketAccess(ticket, actor);

  if (actor.role === 'employee') {
    throw ApiError.forbidden('Employees cannot reopen tickets');
  }

  if (!['resolved', 'closed'].includes(ticket.status)) {
    throw ApiError.badRequest('Only resolved or closed tickets can be reopened');
  }

  const fromStatus = ticket.status;
  ticket.status = 'reopened';
  ticket.reopenCount = (ticket.reopenCount || 0) + 1;
  ticket.closedBy = null;
  ticket.closedAt = null;
  ticket.resolution = { remarks: '', attachment: null, resolvedAt: null };
  await ticket.save();

  await logActivity({
    ticket,
    actor,
    action: 'reopened',
    fromStatus,
    toStatus: 'reopened',
    message: message || 'Ticket reopened',
  });

  const recipients = [ticket.assignedTo].filter(Boolean);
  await notifyMany(recipients, {
    ticket,
    type: 'ticket_reopened',
    message: `Ticket ${ticket.ticketCode} reopened`,
  });

  return populateTicket(Ticket.findById(ticket._id));
};

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

  return populateTicket(Ticket.findById(ticket._id));
};

export const exportCsv = async (actor: IUserDocument, query: Record<string, unknown>) => {
  const filter = buildListFilter(actor, query);
  const tickets = await populateTicket(Ticket.find(filter).sort({ createdAt: -1 }).limit(5000));

  const header = [
    'ticketCode',
    'requesterName',
    'mobile',
    'department',
    'complaintType',
    'priority',
    'status',
    'assignedTo',
    'createdAt',
    'expectedResolutionAt',
  ];

  const escape = (val: unknown) => {
    const s = val == null ? '' : String(val);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const rows = tickets.map((t) => {
    const dept = t.department as unknown as { name?: string } | undefined;
    const assignee = t.assignedTo as unknown as { name?: string } | undefined;

    return [
      t.ticketCode,
      t.requester?.name,
      t.requester?.mobile,
      dept?.name,
      t.complaintType,
      t.priority,
      t.status,
      assignee?.name || '',
      t.createdAt?.toISOString(),
      t.expectedResolutionAt?.toISOString() || '',
    ]
      .map(escape)
      .join(',');
  });

  return [header.join(','), ...rows].join('\n');
};

export { OPEN_STATUSES };
export type { TicketStatus };
