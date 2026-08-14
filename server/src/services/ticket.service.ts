import type { Query } from 'mongoose';
import ExcelJS from 'exceljs';
import Ticket, { OPEN_STATUSES, type ITicket, type TicketStatus } from '../models/Ticket';
import Department from '../models/Department';
import User, { type IUserDocument } from '../models/User';
import ActivityLog from '../models/ActivityLog';
import ApiError from '../utils/apiError';
import generateTicketCode from '../utils/generateTicketCode';
import { uploadBuffer, type UploadableFile } from '../utils/upload';
import { logActivity, notify, notifyMany } from './activity.service';
import { sendEmail } from '../config/email';
import { getSettings } from './setting.service';

import type { ISetting } from '../models/Setting';

const notifyRequesterOnAction = async (
  ticket: ITicket,
  actionTitle: string,
  actionDetail: string,
  eventType?: keyof ISetting['notifyEvents']
) => {
  try {
    const settings = await getSettings();
    if (!settings.emailNotificationsEnabled) return;

    if (eventType && settings.notifyEvents && settings.notifyEvents[eventType] === false) {
      return;
    }

    if (!settings.notifyRequesterOnEveryAction && (!eventType || !settings.notifyEvents?.[eventType])) {
      return;
    }

    if (!ticket.requester || !ticket.requester.email) return;

    const deptName = (ticket.department as unknown as { name?: string })?.name || 'Support Department';
    const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
    const trackUrl = `${clientOrigin}/track-ticket?ticketCode=${encodeURIComponent(ticket.ticketCode)}&mobile=${encodeURIComponent(ticket.requester.mobile)}`;

    const subject = `[TMS Ticket #${ticket.ticketCode}] ${actionTitle}`;
    const html = `
      <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <div style="background-color: #1e3a8a; padding: 24px; text-align: center; color: white;">
          <h2 style="margin: 0; font-size: 22px; font-weight: bold; letter-spacing: -0.5px;">TMS Portal</h2>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #fde047; text-transform: uppercase; font-weight: bold; tracking: 1px;">${actionTitle}</p>
        </div>

        <div style="padding: 28px; background-color: #ffffff;">
          <p style="font-size: 15px; margin-top: 0; color: #334155;">Dear <strong>${ticket.requester.name}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.6; color: #475569;">
            ${actionDetail}
          </p>

          <!-- Ticket Summary Card -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: bold; width: 140px;">Ticket Reference:</td>
                <td style="padding: 6px 0; font-family: monospace; font-size: 16px; font-weight: bold; color: #1e3a8a;">${ticket.ticketCode}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Department:</td>
                <td style="padding: 6px 0; color: #1e293b; font-weight: 600;">${deptName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Complaint Type:</td>
                <td style="padding: 6px 0; color: #1e293b; font-weight: 600;">${ticket.complaintType}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Current Status:</td>
                <td style="padding: 6px 0;">
                  <span style="display: inline-block; background-color: #dbeafe; color: #1e40af; font-weight: bold; padding: 3px 10px; border-radius: 9999px; font-size: 11px; text-transform: uppercase;">
                    ${ticket.status.replace('_', ' ')}
                  </span>
                </td>
              </tr>
              ${ticket.expectedResolutionAt ? `
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Target Resolution:</td>
                <td style="padding: 6px 0; color: #047857; font-weight: bold;">${new Date(ticket.expectedResolutionAt).toLocaleString()}</td>
              </tr>
              ` : ''}
            </table>

            <div style="margin-top: 14px; pt: 12px; border-top: 1px border #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: bold; uppercase;">Description:</p>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #334155; font-style: italic;">"${ticket.description}"</p>
            </div>
          </div>

          <!-- Direct Track Action Button -->
          <div style="text-align: center; margin: 28px 0 16px 0;">
            <a href="${trackUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 14px; padding: 12px 28px; border-radius: 10px; box-shadow: 0 2px 4px rgba(37,99,235,0.3);">
              Track Ticket Status Live →
            </a>
          </div>

          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-bottom: 0;">
            Sri Eshwar College of Engineering · Ticket Management System
          </p>
        </div>
      </div>
    `;

    await sendEmail({
      to: ticket.requester.email,
      subject,
      html,
      text: `${actionTitle}: Your ticket #${ticket.ticketCode} (${ticket.complaintType}) - Status: ${ticket.status}. Track online at: ${trackUrl}`,
    });
  } catch (err) {
    console.error('Error sending email to requester:', err);
  }
};

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
      { 'requester.rollNumber': { $regex: query.search, $options: 'i' } },
      { complaintType: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } },
    ];
  }

  return filter;
};

export const createPublicTicket = async (
  body: Record<string, unknown>,
  file?: UploadableFile | Express.Multer.File,
  files?: Array<UploadableFile | Express.Multer.File>
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

  const rawFiles = files && files.length ? files : file ? [file] : [];
  const userAttachments = [];
  for (const f of rawFiles) {
    const uploaded = await uploadBuffer(f, 'tms/tickets');
    if (uploaded) userAttachments.push(uploaded);
  }
  const userAttachment = userAttachments.length ? userAttachments[0] : null;

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
      userType: (body.userType as 'student' | 'staff' | 'guest') || 'guest',
      rollNumber: (body.rollNumber as string) || '',
    },
    department: department._id,
    complaintType: body.complaintType as string,
    description: body.description as string,
    userAttachment,
    userAttachments,
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

  void notifyRequesterOnAction(ticket, 'Ticket Created Successfully', `Your ticket #${ticket.ticketCode} has been logged.`, 'created');

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

  void notifyRequesterOnAction(ticket, 'Ticket Assigned to Staff', `Your ticket has been assigned to ${employee.name}.`, 'assigned');

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

  void notifyRequesterOnAction(ticket, 'Ticket Reassigned', `Your ticket has been reassigned to ${employee.name}.`, 'assigned');

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

  void notifyRequesterOnAction(
    ticket,
    `Status Changed: ${status.replace('_', ' ').toUpperCase()}`,
    message || `Work on your ticket is now ${status.replace('_', ' ')}.`,
    'statusChanged'
  );

  return populateTicket(Ticket.findById(ticket._id));
};

export const resolveTicket = async (
  id: string,
  { remarks }: { remarks: string },
  file?: UploadableFile | Express.Multer.File,
  files?: Array<UploadableFile | Express.Multer.File>,
  actor?: IUserDocument
) => {
  const ticket = await Ticket.findById(id);
  if (!ticket) throw ApiError.notFound('Ticket not found');
  if (actor) assertTicketAccess(ticket, actor);

  if (actor && actor.role === 'employee') {
    if (!ticket.assignedTo || String(ticket.assignedTo) !== String(actor._id)) {
      throw ApiError.forbidden();
    }
  }

  if (!['new', 'assigned', 'accepted', 'in_progress', 'reopened'].includes(ticket.status)) {
    throw ApiError.badRequest(`Cannot resolve ticket in status "${ticket.status}"`);
  }

  const rawFiles = files && files.length ? files : file ? [file] : [];
  const resolutionAttachments = [];
  for (const f of rawFiles) {
    const uploaded = await uploadBuffer(f, 'tms/resolutions');
    if (uploaded) resolutionAttachments.push(uploaded);
  }
  const resolutionAttachment = resolutionAttachments.length ? resolutionAttachments[0] : null;

  const fromStatus = ticket.status;
  ticket.status = 'resolved';
  ticket.resolution = {
    remarks: remarks || 'Resolved by department manager/staff',
    attachment: resolutionAttachment,
    attachments: resolutionAttachments,
    resolvedAt: new Date(),
  };
  await ticket.save();

  await logActivity({
    ticket,
    actor,
    action: 'status_changed',
    fromStatus,
    toStatus: 'resolved',
    message: remarks || 'Ticket marked resolved',
  });

  const dept = await Department.findById(ticket.department);
  const recipients = [dept?.manager, ticket.assignedBy].filter(Boolean);
  await notifyMany(recipients, {
    ticket,
    type: 'ticket_resolved',
    message: `Ticket ${ticket.ticketCode} resolved`,
  });

  void notifyRequesterOnAction(ticket, 'Ticket Marked Resolved', remarks || 'Your ticket has been marked resolved.', 'resolved');

  return populateTicket(Ticket.findById(ticket._id));
};

export const closeTicket = async (id: string, actor: IUserDocument) => {
  const ticket = await Ticket.findById(id);
  if (!ticket) throw ApiError.notFound('Ticket not found');
  assertTicketAccess(ticket, actor);

  if (actor.role === 'employee') {
    throw ApiError.forbidden('Employees cannot close tickets');
  }

  if (ticket.status === 'closed') {
    throw ApiError.badRequest('Ticket is already closed');
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
    message: 'Ticket completed & closed',
  });

  if (ticket.assignedTo) {
    await notify({
      recipient: ticket.assignedTo,
      ticket,
      type: 'ticket_closed',
      message: `Ticket ${ticket.ticketCode} closed`,
    });
  }

  void notifyRequesterOnAction(ticket, 'Ticket Completed & Closed', 'Your ticket has been officially closed.', 'closed');

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
  ticket.resolution = { remarks: '', attachment: null, attachments: [], resolvedAt: null };
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

  void notifyRequesterOnAction(ticket, 'Ticket Reopened', message || 'Your ticket has been reopened for further action.', 'reopened');

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

  void notifyRequesterOnAction(ticket, 'New Staff Comment Added', `Comment: "${message}"`, 'commented');

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

export const exportExcel = async (actor: IUserDocument, query: Record<string, unknown>) => {
  const filter = buildListFilter(actor, query);
  const tickets = await populateTicket(Ticket.find(filter).sort({ createdAt: -1 }).limit(10000));

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Ticket Management System';
  workbook.lastModifiedBy = actor.name;
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Tickets Report', {
    pageSetup: { paperSize: 9, orientation: 'landscape' },
  });

  // Title Header Block
  worksheet.mergeCells('A1:O1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'TICKET MANAGEMENT SYSTEM - PERFORMANCE & RESOLUTION REPORT';
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A8A' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 36;

  // Metadata Row
  worksheet.mergeCells('A2:O2');
  const metaCell = worksheet.getCell('A2');
  metaCell.value = `Generated on: ${new Date().toLocaleString()} | Total Records: ${tickets.length} | Exported by: ${actor.name}`;
  metaCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: '475569' } };
  metaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
  metaCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 22;

  // Empty Row
  worksheet.getRow(3).height = 10;

  // Column Headers
  const headers = [
    'Ticket Code',
    'Requester Name',
    'Mobile',
    'Roll Number',
    'Department',
    'Complaint Type',
    'Priority',
    'Status',
    'Assigned To',
    'Issue Description',
    'Resolution Remarks',
    'User Attachment Image URL',
    'Resolution Proof Image URL',
    'Feedback Rating',
    'Created Date',
  ];
  const headerRow = worksheet.getRow(4);
  headerRow.values = headers;
  headerRow.height = 26;

  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: '94A3B8' } },
      bottom: { style: 'medium', color: { argb: '1E3A8A' } },
      left: { style: 'thin', color: { argb: '94A3B8' } },
      right: { style: 'thin', color: { argb: '94A3B8' } },
    };
  });

  // Status Style Definitions (Colors for cells)
  const statusFills: Record<string, { fgColor: string; textColor: string }> = {
    new: { fgColor: 'DBEAFE', textColor: '1E40AF' },
    assigned: { fgColor: 'E0E7FF', textColor: '3730A3' },
    accepted: { fgColor: 'FEF3C7', textColor: '92400E' },
    in_progress: { fgColor: 'FFEDD5', textColor: '9A3412' },
    resolved: { fgColor: 'DCFCE7', textColor: '166534' },
    closed: { fgColor: 'E2E8F0', textColor: '334155' },
    reopened: { fgColor: 'FEE2E2', textColor: '991B1B' },
  };

  // Priority Style Definitions
  const priorityFills: Record<string, { fgColor: string; textColor: string }> = {
    low: { fgColor: 'F3F4F6', textColor: '4B5563' },
    medium: { fgColor: 'E0F2FE', textColor: '075985' },
    high: { fgColor: 'FFEDD5', textColor: 'C2410C' },
    urgent: { fgColor: 'FEE2E2', textColor: 'B91C1C' },
  };

  // Populate Ticket Data Rows
  tickets.forEach((t, idx) => {
    const dept = t.department as unknown as { name?: string } | undefined;
    const assignee = t.assignedTo as unknown as { name?: string } | undefined;
    const userAttUrl = t.userAttachments?.length ? t.userAttachments[0]?.url : t.userAttachment?.url || '—';
    const resAttUrl = t.resolution?.attachments?.length ? t.resolution.attachments[0]?.url : t.resolution?.attachment?.url || '—';
    const feedbackText = t.feedback?.rating
      ? `${t.feedback.rating}★ ${t.feedback.comment ? `("${t.feedback.comment}")` : ''}`
      : 'Unrated';

    const rowIndex = idx + 5;
    const row = worksheet.getRow(rowIndex);

    row.values = [
      t.ticketCode,
      t.requester?.name || '—',
      t.requester?.mobile || '—',
      t.requester?.rollNumber || '—',
      dept?.name || '—',
      t.complaintType || '—',
      (t.priority || 'medium').toUpperCase(),
      (t.status || 'new').toUpperCase().replace('_', ' '),
      assignee?.name || 'Unassigned',
      t.description || '—',
      t.resolution?.remarks || '—',
      userAttUrl,
      resAttUrl,
      feedbackText,
      t.createdAt ? new Date(t.createdAt).toLocaleString() : '—',
    ];

    row.height = 24;

    const isZebra = idx % 2 === 1;
    const bgArgb = isZebra ? 'F8FAFC' : 'FFFFFF';

    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Arial', size: 10, color: { argb: '1E293B' } };
      cell.alignment = {
        vertical: 'middle',
        horizontal: colNumber === 1 || colNumber === 7 || colNumber === 8 || colNumber === 14 ? 'center' : 'left',
        wrapText: colNumber === 10 || colNumber === 11,
      };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'E2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
        left: { style: 'thin', color: { argb: 'E2E8F0' } },
        right: { style: 'thin', color: { argb: 'E2E8F0' } },
      };

      // Column 7: Priority formatting
      if (colNumber === 7) {
        const pStyle = priorityFills[t.priority] || priorityFills.medium;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pStyle.fgColor } };
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: pStyle.textColor } };
      }

      // Column 8: Status formatting
      if (colNumber === 8) {
        const sStyle = statusFills[t.status] || statusFills.new;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sStyle.fgColor } };
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: sStyle.textColor } };
      }
    });
  });

  // Auto-fit Column Widths
  worksheet.columns.forEach((column, colIdx) => {
    let maxLen = 12;
    column.eachCell?.({ includeEmpty: false }, (cell) => {
      const len = cell.value ? String(cell.value).length : 0;
      if (len > maxLen) maxLen = len;
    });
    // Give extra width for description, remarks and image links
    if (colIdx === 9 || colIdx === 10) {
      column.width = 35;
    } else if (colIdx === 11 || colIdx === 12) {
      column.width = 40;
    } else {
      column.width = Math.min(Math.max(maxLen + 4, 12), 40);
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

/**
 * Submit feedback for a resolved or closed ticket
 */
export const submitFeedback = async (
  ticketCode: string,
  mobile: string,
  rating: number,
  comment?: string,
  tags?: string[]
) => {
  const settings = await getSettings();
  if (!settings.feedbackEnabled) {
    throw new ApiError(403, 'Ticket Feedback System is currently disabled by Admin.');
  }

  if (!rating || rating < 1 || rating > 5) {
    throw new ApiError(400, 'Rating must be between 1 and 5 stars.');
  }

  const cleanCode = String(ticketCode || '').trim().toUpperCase();
  const cleanMobile = String(mobile || '').trim();

  let ticket = await Ticket.findOne({
    ticketCode: cleanCode,
    'requester.mobile': cleanMobile,
  });

  if (!ticket) {
    // Try matching normalized mobile (digits only)
    ticket = await Ticket.findOne({ ticketCode: cleanCode });
    const normalizedTargetMobile = cleanMobile.replace(/\D/g, '');
    const normalizedTicketMobile = (ticket?.requester?.mobile || '').replace(/\D/g, '');

    if (
      !ticket ||
      (normalizedTargetMobile &&
        normalizedTicketMobile &&
        !normalizedTicketMobile.endsWith(normalizedTargetMobile) &&
        !normalizedTargetMobile.endsWith(normalizedTicketMobile))
    ) {
      throw new ApiError(404, 'Ticket not found. Check your reference code and mobile number.');
    }
  }

  if (ticket.status !== 'resolved' && ticket.status !== 'closed') {
    throw new ApiError(400, 'Feedback can only be submitted for resolved or closed tickets.');
  }

  ticket.feedback = {
    rating,
    comment: comment?.trim() || '',
    tags: tags || [],
    submittedAt: new Date(),
  };

  await ticket.save();

  try {
    await ActivityLog.create({
      ticket: ticket._id,
      actor: null,
      action: 'feedback_submitted',
      fromStatus: ticket.status,
      toStatus: ticket.status,
      message: `Customer submitted ${rating}-star rating: ${comment?.trim() || 'No comment'}`,
    });
  } catch (logErr) {
    console.error('Failed to log feedback activity:', logErr);
  }

  return populateTicket(Ticket.findById(ticket._id));
};

/**
 * Admin view of all ticket feedback with search & filters
 */
export const getAdminFeedbackList = async (query: Record<string, unknown>) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {
    'feedback.rating': { $exists: true, $ne: null },
  };

  if (query.department) {
    filter.department = query.department;
  }
  if (query.rating) {
    filter['feedback.rating'] = Number(query.rating);
  }
  if (query.search) {
    const searchRegex = new RegExp(String(query.search).trim(), 'i');
    filter.$or = [
      { ticketCode: searchRegex },
      { 'requester.name': searchRegex },
      { 'requester.mobile': searchRegex },
      { 'feedback.comment': searchRegex },
    ];
  }

  const total = await Ticket.countDocuments(filter);
  const tickets = await Ticket.find(filter)
    .sort({ 'feedback.submittedAt': -1 })
    .skip(skip)
    .limit(limit)
    .populate('department', 'name code icon')
    .populate('assignedTo', 'name email avatar')
    .lean();

  return {
    tickets,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

/**
 * Admin analytics for department-wise feedback scores
 */
export const getDepartmentFeedbackAnalytics = async () => {
  const pipeline = [
    {
      $match: {
        'feedback.rating': { $exists: true, $ne: null },
      },
    },
    {
      $group: {
        _id: '$department',
        totalFeedback: { $sum: 1 },
        avgRating: { $avg: '$feedback.rating' },
        star5Count: { $sum: { $cond: [{ $eq: ['$feedback.rating', 5] }, 1, 0] } },
        star4Count: { $sum: { $cond: [{ $eq: ['$feedback.rating', 4] }, 1, 0] } },
        star3Count: { $sum: { $cond: [{ $eq: ['$feedback.rating', 3] }, 1, 0] } },
        star2Count: { $sum: { $cond: [{ $eq: ['$feedback.rating', 2] }, 1, 0] } },
        star1Count: { $sum: { $cond: [{ $eq: ['$feedback.rating', 1] }, 1, 0] } },
        satisfiedCount: { $sum: { $cond: [{ $gte: ['$feedback.rating', 4] }, 1, 0] } },
      },
    },
    {
      $lookup: {
        from: 'departments',
        localField: '_id',
        foreignField: '_id',
        as: 'departmentDoc',
      },
    },
    {
      $unwind: '$departmentDoc',
    },
    {
      $project: {
        _id: 1,
        departmentName: '$departmentDoc.name',
        departmentCode: '$departmentDoc.code',
        departmentIcon: '$departmentDoc.icon',
        totalFeedback: 1,
        avgRating: { $round: ['$avgRating', 1] },
        satisfactionRate: {
          $round: [
            { $multiply: [{ $divide: ['$satisfiedCount', '$totalFeedback'] }, 100] },
            1,
          ],
        },
        distribution: {
          5: '$star5Count',
          4: '$star4Count',
          3: '$star3Count',
          2: '$star2Count',
          1: '$star1Count',
        },
      },
    },
    {
      $sort: { avgRating: -1, totalFeedback: -1 },
    },
  ];

  const analytics = await Ticket.aggregate(pipeline as any);
  return analytics;
};

export { OPEN_STATUSES };
export type { TicketStatus };
