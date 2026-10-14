import Ticket, { type TicketStatus } from '../../models/Ticket';
import Department from '../../models/Department';
import User, { type IUserDocument } from '../../models/User';
import ApiError from '../../utils/apiError';
import { uploadBuffer, type UploadableFile } from '../../utils/upload';
import { logActivity, notify, notifyMany } from '../activity.service';
import { getSettings } from '../setting.service';
import { notifyRequesterOnAction } from './ticketNotification.service';
import { assertTicketAccess, populateTicket } from './ticketCommon';

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
  file?: UploadableFile,
  files?: Array<UploadableFile>,
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

  const settings = await getSettings();
  const isEmployee = actor && actor.role === 'employee';

  let needsApproval = false;
  if (isEmployee) {
    if (settings.approvalRequired === false || settings.approvalMode === 'disabled') {
      needsApproval = false;
    } else if (settings.approvalMode === 'high_priority_only') {
      needsApproval = ['high', 'urgent'].includes(ticket.priority);
    } else {
      needsApproval = true;
    }
  }

  const newStatus = needsApproval ? 'pending_approval' : 'resolved';

  ticket.status = newStatus as TicketStatus;
  ticket.resolution = {
    remarks: remarks || 'Resolved by department manager/staff',
    attachment: resolutionAttachment,
    attachments: resolutionAttachments,
    resolvedAt: newStatus === 'resolved' ? new Date() : null,
  };

  if (!ticket.resolutionHistory) {
    ticket.resolutionHistory = [];
  }
  ticket.resolutionHistory.push({
    remarks: remarks || 'Resolved by department manager/staff',
    attachment: resolutionAttachment,
    attachments: resolutionAttachments,
    resolvedAt: newStatus === 'resolved' ? new Date() : null,
    resolvedBy: actor ? (actor._id as any) : null,
    actionType: needsApproval ? 'pending_approval' : 'resolved',
    createdAt: new Date(),
  } as any);

  if (needsApproval && actor) {
    ticket.approvalRequestedAt = new Date();
    ticket.approvalRequestedBy = actor._id;
  }

  await ticket.save();

  await logActivity({
    ticket,
    actor,
    action: 'status_changed',
    fromStatus,
    toStatus: newStatus as TicketStatus,
    message: needsApproval
      ? `${remarks || 'Work completed'} — Awaiting approval to close`
      : remarks || 'Ticket marked resolved',
  });

  if (needsApproval) {
    if (settings.notifyManagerOnPendingApproval !== false) {
      const dept = await Department.findById(ticket.department);
      const managers = await User.find({
        role: 'manager',
        department: ticket.department,
        isActive: true,
      });
      const recipients = [...managers.map((m) => m._id), dept?.manager, ticket.assignedBy].filter(Boolean);
      await notifyMany(recipients, {
        ticket,
        type: 'ticket_resolved',
        message: `Ticket ${ticket.ticketCode} completed by staff — awaiting your review & approval`,
      });
    }
    void notifyRequesterOnAction(ticket, 'Work Completed — Awaiting Review', 'The assigned staff has completed work on your ticket. It is now under review for final approval.', 'approvalRequested');
  } else {
    const dept = await Department.findById(ticket.department);
    const recipients = [dept?.manager, ticket.assignedBy].filter(Boolean);
    await notifyMany(recipients, {
      ticket,
      type: 'ticket_resolved',
      message: `Ticket ${ticket.ticketCode} resolved`,
    });
    void notifyRequesterOnAction(ticket, 'Ticket Marked Resolved', remarks || 'Your ticket has been marked resolved.', 'resolved');
  }

  return populateTicket(Ticket.findById(ticket._id));
};

export const updateResolutionProof = async (
  id: string,
  { remarks }: { remarks?: string },
  file?: UploadableFile,
  files?: Array<UploadableFile>,
  actor?: IUserDocument
) => {
  const ticket = await Ticket.findById(id);
  if (!ticket) throw ApiError.notFound('Ticket not found');
  if (actor) assertTicketAccess(ticket, actor);

  if (actor && actor.role === 'employee') {
    const assigned = ticket.assignedTo as { _id?: unknown } | unknown;
    const assignedId = assigned
      ? String(
          assigned && typeof assigned === 'object' && '_id' in (assigned as object)
            ? (assigned as { _id: unknown })._id
            : assigned
        )
      : null;
    if (!ticket.assignedTo || assignedId !== String(actor._id)) {
      throw ApiError.forbidden('You can only update proof for your own assigned tickets');
    }
  }

  if (
    ticket.resolution &&
    (ticket.resolution.attachment?.url ||
      (ticket.resolution.attachments && ticket.resolution.attachments.length > 0) ||
      ticket.resolution.remarks)
  ) {
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
        remarks: ticket.resolution.remarks || 'Resolved',
        attachment: ticket.resolution.attachment || null,
        attachments: ticket.resolution.attachments || [],
        resolvedAt: ticket.resolution.resolvedAt || ticket.updatedAt || new Date(),
        resolvedBy: ticket.assignedTo || (actor ? (actor._id as any) : null),
        actionType: 'resolved',
        createdAt: ticket.resolution.resolvedAt || ticket.updatedAt || new Date(),
      } as any);
    }
  }

  const rawFiles = files && files.length ? files : file ? [file] : [];
  let resolutionAttachments = ticket.resolution?.attachments ? [...ticket.resolution.attachments] : [];
  let resolutionAttachment = ticket.resolution?.attachment || null;

  let hasNewFile = false;
  if (rawFiles.length > 0) {
    const newAttachments = [];
    for (const f of rawFiles) {
      const uploaded = await uploadBuffer(f, 'tms/resolutions');
      if (uploaded) newAttachments.push(uploaded);
    }
    if (newAttachments.length > 0) {
      resolutionAttachments = newAttachments;
      resolutionAttachment = newAttachments[0];
      hasNewFile = true;
    }
  }

  const prevRemarks = ticket.resolution?.remarks || '';
  const finalRemarks = remarks !== undefined ? remarks.trim() : prevRemarks;

  ticket.resolution = {
    remarks: finalRemarks,
    attachment: resolutionAttachment,
    attachments: resolutionAttachments,
    resolvedAt: ticket.resolution?.resolvedAt || new Date(),
  };

  if (!ticket.resolutionHistory) {
    ticket.resolutionHistory = [];
  }

  ticket.resolutionHistory.push({
    remarks: finalRemarks,
    attachment: resolutionAttachment,
    attachments: resolutionAttachments,
    resolvedAt: new Date(),
    resolvedBy: actor ? (actor._id as any) : null,
    actionType: hasNewFile ? 'updated_proof' : 'updated_proof',
    createdAt: new Date(),
  } as any);

  await ticket.save();

  await logActivity({
    ticket,
    actor,
    action: 'updated',
    message: `Work completion proof/notes updated by ${actor?.name || 'staff'}`,
  });

  return populateTicket(Ticket.findById(ticket._id));
};

export const approveAndCloseTicket = async (id: string, actor: IUserDocument, message?: string) => {
  const ticket = await Ticket.findById(id);
  if (!ticket) throw ApiError.notFound('Ticket not found');
  assertTicketAccess(ticket, actor);

  if (actor.role === 'employee') {
    throw ApiError.forbidden('Employees cannot approve ticket closure');
  }

  if (ticket.status !== 'pending_approval') {
    throw ApiError.badRequest('Ticket is not awaiting approval');
  }

  const settings = await getSettings();
  const shouldAutoClose = settings.autoCloseOnApproval !== false;
  const targetStatus: TicketStatus = shouldAutoClose ? 'closed' : 'resolved';

  const fromStatus = ticket.status;
  ticket.status = targetStatus;
  if (shouldAutoClose) {
    ticket.closedBy = actor._id;
    ticket.closedAt = new Date();
  }
  if (ticket.resolution) {
    ticket.resolution.resolvedAt = new Date();
  }
  await ticket.save();

  await logActivity({
    ticket,
    actor,
    action: shouldAutoClose ? 'closed' : 'status_changed',
    fromStatus,
    toStatus: targetStatus,
    message: message?.trim() ? `Approved: ${message.trim()}` : `Ticket approved by reviewer (${targetStatus})`,
  });

  if (ticket.assignedTo) {
    await notify({
      recipient: ticket.assignedTo,
      ticket,
      type: 'ticket_closed',
      message: message?.trim()
        ? `Ticket ${ticket.ticketCode} approved: ${message.trim()}`
        : `Ticket ${ticket.ticketCode} approved by manager`,
    });
  }

  void notifyRequesterOnAction(
    ticket,
    shouldAutoClose ? 'Ticket Completed & Closed' : 'Ticket Approved & Resolved',
    message || 'Your ticket resolution has been reviewed and officially approved.',
    'approved'
  );

  return populateTicket(Ticket.findById(ticket._id));
};

export const closeTicket = async (id: string, actor: IUserDocument) => {
  const ticket = await Ticket.findById(id);
  if (!ticket) throw ApiError.notFound('Ticket not found');
  assertTicketAccess(ticket, actor);

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
    message:
      actor.role === 'employee'
        ? `Ticket completed & closed by employee (${actor.name})`
        : 'Ticket completed & closed',
  });

  if (ticket.assignedTo && String(ticket.assignedTo) !== String(actor._id)) {
    await notify({
      recipient: ticket.assignedTo,
      ticket,
      type: 'ticket_closed',
      message: `Ticket ${ticket.ticketCode} closed`,
    });
  }

  const dept = await Department.findById(ticket.department);
  if (dept?.manager && String(dept.manager) !== String(actor._id)) {
    await notify({
      recipient: dept.manager,
      ticket,
      type: 'ticket_closed',
      message: `Ticket ${ticket.ticketCode} closed by ${actor.name}`,
    });
  }

  void notifyRequesterOnAction(ticket, 'Ticket Completed & Closed', 'Your ticket has been officially closed.', 'closed');

  return populateTicket(Ticket.findById(ticket._id));
};

export const reopenTicket = async (id: string, actor: IUserDocument, message?: string) => {
  const ticket = await Ticket.findById(id);
  if (!ticket) throw ApiError.notFound('Ticket not found');
  assertTicketAccess(ticket, actor);

  if (!['resolved', 'closed', 'pending_approval'].includes(ticket.status)) {
    throw ApiError.badRequest('Only resolved, closed, or pending approval tickets can be reopened');
  }

  const fromStatus = ticket.status;
  const isRejection = fromStatus === 'pending_approval';

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
        resolvedBy: ticket.assignedTo || (actor._id as any),
        actionType: isRejection ? 'approval_rejected' : 'reopened',
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
    ? (isRejection ? `Work Rejected & Reopened: ${message.trim()}` : `Ticket reopened by ${actor.name}: ${message.trim()}`)
    : (isRejection ? 'Work rejected by reviewer and reopened for rework' : `Ticket reopened by ${actor.name}`);

  await logActivity({
    ticket,
    actor,
    action: 'reopened',
    fromStatus,
    toStatus: 'reopened',
    message: activityMsg,
  });

  const dept = await Department.findById(ticket.department);
  const recipients = [ticket.assignedTo, dept?.manager]
    .filter(Boolean)
    .filter((r) => String(r) !== String(actor._id));
  if (recipients.length > 0) {
    await notifyMany(recipients as any, {
      ticket,
      type: 'ticket_reopened',
      message: isRejection
        ? `Ticket ${ticket.ticketCode} work rejected: ${message?.trim() || 'Please review feedback and rework.'}`
        : `Ticket ${ticket.ticketCode} reopened by ${actor.name}${message?.trim() ? `: ${message.trim()}` : ''}`,
    });
  }

  void notifyRequesterOnAction(ticket, 'Ticket Reopened', message || 'Your ticket has been reopened for further action.', 'reopened');

  return populateTicket(Ticket.findById(ticket._id));
};
