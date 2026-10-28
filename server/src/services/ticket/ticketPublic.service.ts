import Ticket, { type ITicketDocument } from '../../models/Ticket';
import Department from '../../models/Department';
import User from '../../models/User';
import ActivityLog from '../../models/ActivityLog';
import ApiError from '../../utils/apiError';
import generateTicketCode from '../../utils/generateTicketCode';
import { uploadBuffer, type UploadableFile } from '../../utils/upload';
import { logActivity, notify, notifyMany } from '../activity.service';
import {
  notifyRequesterOnAction,
  notifyStaffOnTicketCreated,
  notifyEmployeeOnAssignment,
} from './ticketNotification.service';
import { populateTicket } from './ticketCommon';

export const createPublicTicket = async (
  body: Record<string, unknown>,
  file?: UploadableFile,
  files?: Array<UploadableFile>
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

  let block = ((body.block as string) || '').trim();
  let floor = ((body.floor as string) || '').trim();

  // Validate block & floor if department has location classification enabled
  if (department.locationEnabled && department.blocks?.length) {
    if (!block) {
      throw ApiError.badRequest('Block selection is required for this department');
    }
    const matchedBlock = department.blocks.find(
      (b) => b.blockName.trim().toLowerCase() === block.toLowerCase()
    );
    if (!matchedBlock) {
      throw ApiError.badRequest(`Invalid block "${block}" for this department`);
    }
    block = matchedBlock.blockName;

    if (matchedBlock.floors?.length) {
      if (!floor) {
        throw ApiError.badRequest('Floor selection is required for this department');
      }
      const matchedFloor = matchedBlock.floors.find(
        (f) => f.floorName.trim().toLowerCase() === floor.toLowerCase()
      );
      if (!matchedFloor) {
        throw ApiError.badRequest(`Invalid floor "${floor}" for block "${block}"`);
      }
      floor = matchedFloor.floorName;
    }
  }

  // Determine auto-assignee:
  // 1. Check if the selected floor has a specific defaultAssignee
  // 2. Otherwise fall back to department.defaultAssignee
  let autoAssigneeId: unknown = null;
  let assignSource = '';

  if (department.locationEnabled && department.blocks?.length && block && floor) {
    const matchedBlock = department.blocks.find(
      (b) => b.blockName.trim().toLowerCase() === block.toLowerCase()
    );
    if (matchedBlock) {
      const matchedFloor = matchedBlock.floors?.find(
        (f) => f.floorName.trim().toLowerCase() === floor.toLowerCase()
      );
      if (matchedFloor?.defaultAssignee) {
        autoAssigneeId = matchedFloor.defaultAssignee;
        assignSource = `Floor Assignee (${block} - ${floor})`;
      }
    }
  }

  if (!autoAssigneeId && department.defaultAssignee) {
    autoAssigneeId = department.defaultAssignee;
    assignSource = 'Department Default Assignee';
  }

  let assignedEmployee = null;
  if (autoAssigneeId) {
    const emp = await User.findById(autoAssigneeId);
    if (emp && emp.isActive) {
      assignedEmployee = emp;
    }
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
    title: (body.title as string) || (body.complaintType as string),
    requester: {
      name: body.name as string,
      mobile: body.mobile as string,
      email: (body.email as string) || '',
      userType: (body.userType as 'student' | 'staff' | 'guest') || 'guest',
      rollNumber: (body.rollNumber as string) || '',
      department:
        (body.requesterDepartment as string) ||
        (body.departmentName as string) ||
        ((body.requester as any)?.department as string) ||
        '',
    },
    department: department._id,
    complaintType: body.complaintType as string,
    description: body.description as string,
    userAttachment,
    userAttachments,
    priority: (body.priority as string) || 'medium',
    status: assignedEmployee ? 'assigned' : 'new',
    assignedTo: assignedEmployee ? assignedEmployee._id : null,
    assignedBy: null,
    expectedResolutionAt,
    eventDate: body.eventDate ? new Date(body.eventDate as string) : null,
    venue: (body.venue as string) || '',
    eventTime: (body.eventTime as string) || '',
    block,
    floor,
  });

  await logActivity({
    ticket,
    actor: null,
    action: 'created',
    toStatus: 'new',
    message: `Ticket ${ticketCode} created by ${body.name}`,
  });

  if (assignedEmployee) {
    await logActivity({
      ticket,
      actor: null,
      action: 'assigned',
      fromStatus: 'new',
      toStatus: 'assigned',
      message: `Auto-assigned to ${assignedEmployee.name} (${assignSource})`,
    });

    await notify({
      recipient: assignedEmployee._id,
      ticket,
      type: 'ticket_assigned',
      message: `Ticket ${ticketCode} automatically assigned to you`,
    });

    void notifyEmployeeOnAssignment(ticket, assignedEmployee);
  }

  if (department.manager) {
    await notify({
      recipient: department.manager,
      ticket,
      type: 'ticket_created',
      message: `New ticket ${ticketCode} in ${department.name}${
        assignedEmployee ? ` (Assigned to ${assignedEmployee.name})` : ''
      }`,
    });
  }

  if (assignedEmployee) {
    void notifyRequesterOnAction(
      ticket,
      'Ticket Created & Assigned to Staff',
      `Your ticket #${ticket.ticketCode} has been logged and assigned to ${assignedEmployee.name}.`,
      'assigned'
    );
  } else {
    void notifyRequesterOnAction(
      ticket,
      'Ticket Created Successfully',
      `Your ticket #${ticket.ticketCode} has been logged.`,
      'created'
    );
  }
  void notifyStaffOnTicketCreated(ticket, department);

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
      isDeleted: { $ne: true },
    })
  );

  if (!ticket) throw ApiError.notFound('Ticket not found');

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
    .sort({ createdAt: 1 })
    .lean();

  return { ticket, activities };
};

export const requesterApproveClose = async ({
  ticketCode,
  mobile,
  message,
}: {
  ticketCode: string;
  mobile: string;
  message?: string;
}) => {
  const ticket = await Ticket.findOne({
    ticketCode: String(ticketCode).trim().toUpperCase(),
    'requester.mobile': String(mobile).trim(),
    isDeleted: { $ne: true },
  });

  if (!ticket) throw ApiError.notFound('Ticket not found or mobile mismatch');

  if (ticket.status === 'closed') {
    throw ApiError.badRequest('Ticket is already closed');
  }

  const fromStatus = ticket.status;
  ticket.status = 'closed';
  ticket.closedAt = new Date();
  if (ticket.resolution) {
    ticket.resolution.resolvedAt = new Date();
  }
  await ticket.save();

  await logActivity({
    ticket,
    action: 'closed',
    fromStatus,
    toStatus: 'closed',
    message: message?.trim()
      ? `Approved & Closed by Requester (${ticket.requester.name}): ${message.trim()}`
      : `Ticket approved and closed by requester (${ticket.requester.name})`,
  });

  const recipients = [ticket.assignedTo].filter(Boolean);
  if (recipients.length > 0) {
    await notifyMany(recipients, {
      ticket,
      type: 'ticket_closed',
      message: `Ticket ${ticket.ticketCode} approved and closed by requester`,
    });
  }

  const populated = await populateTicket(Ticket.findById(ticket._id));
  const activities = await ActivityLog.find({ ticket: ticket._id })
    .populate('actor', 'name role')
    .sort({ createdAt: 1 })
    .lean();

  return { ticket: populated, activities };
};

export const requesterReopen = async ({
  ticketCode,
  mobile,
  message,
}: {
  ticketCode: string;
  mobile: string;
  message: string;
}) => {
  const ticket = await Ticket.findOne({
    ticketCode: String(ticketCode).trim().toUpperCase(),
    'requester.mobile': String(mobile).trim(),
  });

  if (!ticket) throw ApiError.notFound('Ticket not found or mobile mismatch');

  if (ticket.status === 'reopened') {
    throw ApiError.badRequest('Ticket is already reopened');
  }

  if (!['resolved', 'closed', 'pending_approval'].includes(ticket.status)) {
    throw ApiError.badRequest('Only resolved, closed, or pending approval tickets can be reopened');
  }

  const fromStatus = ticket.status;

  if (ticket.resolution && (ticket.resolution.attachment?.url || (ticket.resolution.attachments && ticket.resolution.attachments.length > 0) || ticket.resolution.remarks)) {
    if (!ticket.resolutionHistory) {
      ticket.resolutionHistory = [];
    }
    const alreadySaved = ticket.resolutionHistory.some(
      (h) =>
        h.attachment?.url === ticket.resolution?.attachment?.url &&
        h.remarks === ticket.resolution?.remarks
    );
    if (!alreadySaved) {
      ticket.resolutionHistory.push({
        remarks: ticket.resolution.remarks,
        attachment: ticket.resolution.attachment,
        attachments: ticket.resolution.attachments || [],
        resolvedAt: ticket.resolution.resolvedAt || new Date(),
        resolvedBy: ticket.assignedTo || null,
        actionType: fromStatus === 'closed' ? 'reopened_from_closed' : 'requester_rejected',
        createdAt: new Date(),
      } as any);
    }
  }

  ticket.status = 'reopened';
  ticket.reopenCount = (ticket.reopenCount || 0) + 1;
  ticket.closedBy = null;
  ticket.closedAt = null;
  ticket.resolution = { remarks: '', attachment: null, attachments: [], resolvedAt: null };
  await ticket.save();

  const activityMsg = message?.trim()
    ? (fromStatus === 'closed'
        ? `Ticket reopened from Closed status by requester (${ticket.requester.name}): ${message.trim()}`
        : `Work Rejected by Requester (${ticket.requester.name}): ${message.trim()}`)
    : (fromStatus === 'closed'
        ? `Ticket reopened from Closed status by requester (${ticket.requester.name})`
        : `Ticket rejected and reopened by requester (${ticket.requester.name})`);

  await logActivity({
    ticket,
    action: 'reopened',
    fromStatus,
    toStatus: 'reopened',
    message: activityMsg,
  });

  const dept = await Department.findById(ticket.department);
  const recipients = [ticket.assignedTo, dept?.manager].filter(Boolean);
  if (recipients.length > 0) {
    await notifyMany(recipients as any, {
      ticket,
      type: 'ticket_reopened',
      message: `Ticket ${ticket.ticketCode} reopened by requester (${ticket.requester.name}): ${message?.trim() || 'Needs rework'}`,
    });
  }

  void notifyRequesterOnAction(ticket, 'Ticket Reopened', message || 'Your ticket has been reopened for rework.', 'reopened');

  const populated = await populateTicket(Ticket.findById(ticket._id));
  const activities = await ActivityLog.find({ ticket: ticket._id })
    .populate('actor', 'name role')
    .sort({ createdAt: 1 })
    .lean();

  return { ticket: populated, activities };
};

export const requesterAddComment = async ({
  ticketCode,
  mobile,
  message,
}: {
  ticketCode: string;
  mobile: string;
  message: string;
}) => {
  const ticket = await Ticket.findOne({
    ticketCode: String(ticketCode).trim().toUpperCase(),
    'requester.mobile': String(mobile).trim(),
  });

  if (!ticket) throw ApiError.notFound('Ticket not found or mobile mismatch');

  if (!message || !message.trim()) {
    throw ApiError.badRequest('Comment message is required');
  }

  ticket.comments.push({
    author: null,
    authorName: ticket.requester.name,
    isRequester: true,
    message: message.trim(),
    createdAt: new Date(),
  } as any);

  await ticket.save();

  await logActivity({
    ticket,
    action: 'commented',
    message: `Requester (${ticket.requester.name}) added a comment: ${message.trim()}`,
  });

  const recipients = [ticket.assignedTo].filter(Boolean);
  if (recipients.length > 0) {
    await notifyMany(recipients, {
      ticket,
      type: 'ticket_assigned',
      message: `New message from requester on ${ticket.ticketCode}: ${message.trim()}`,
    });
  }

  const populated = await populateTicket(Ticket.findById(ticket._id));
  const activities = await ActivityLog.find({ ticket: ticket._id })
    .populate('actor', 'name role')
    .sort({ createdAt: 1 })
    .lean();

  return { ticket: populated, activities };
};
