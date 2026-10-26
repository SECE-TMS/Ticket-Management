import Ticket, { type TicketPriority } from '../../models/Ticket';
import Department from '../../models/Department';
import User, { getUserDepartmentIds, type IUserDocument } from '../../models/User';
import ApiError from '../../utils/apiError';
import { logActivity, notify, notifyMany } from '../activity.service';
import { notifyRequesterOnAction, notifyEmployeeOnAssignment } from './ticketNotification.service';
import { assertTicketAccess, populateTicket } from './ticketCommon';

export interface UpdateTicketDetailsDto {
  department?: string;
  complaintType?: string;
  title?: string;
  description?: string;
  priority?: TicketPriority;
  eventDate?: string | Date | null;
  venue?: string;
  eventTime?: string;
  block?: string;
  floor?: string;
  requester?: {
    name?: string;
    mobile?: string;
    email?: string;
    userType?: 'student' | 'staff' | 'guest';
    rollNumber?: string;
  };
}

export const updateTicketDetails = async (
  id: string,
  payload: UpdateTicketDetailsDto,
  actor: IUserDocument
) => {
  const ticket = await Ticket.findById(id);
  if (!ticket) throw ApiError.notFound('Ticket not found');

  const changes: string[] = [];

  if (payload.department && String(payload.department) !== String(ticket.department)) {
    const newDept = await Department.findById(payload.department);
    if (!newDept) throw ApiError.badRequest('Selected department does not exist');
    ticket.department = newDept._id;
    if (ticket.assignedTo) {
      const assignedEmp = await User.findById(ticket.assignedTo);
      const empDepts = getUserDepartmentIds(assignedEmp);
      if (assignedEmp && !empDepts.includes(String(newDept._id))) {
        ticket.assignedTo = null;
        ticket.assignedBy = null;
        if (ticket.status === 'assigned' || ticket.status === 'accepted' || ticket.status === 'in_progress') {
          ticket.status = 'new';
        }
        changes.push(`Department changed to ${newDept.name} (assigned employee removed)`);
      } else {
        changes.push(`Department changed to ${newDept.name}`);
      }
    } else {
      changes.push(`Department changed to ${newDept.name}`);
    }
  }

  if (payload.complaintType !== undefined && payload.complaintType !== ticket.complaintType) {
    changes.push(`Complaint Type changed to "${payload.complaintType}"`);
    ticket.complaintType = payload.complaintType;
  }

  if (payload.title !== undefined && payload.title !== ticket.title) {
    changes.push('Title updated');
    ticket.title = payload.title;
  }

  if (payload.description !== undefined && payload.description !== ticket.description) {
    changes.push('Description updated');
    ticket.description = payload.description;
  }

  if (payload.priority !== undefined && payload.priority !== ticket.priority) {
    changes.push(`Priority changed to ${payload.priority}`);
    ticket.priority = payload.priority;
  }

  if (payload.requester) {
    let reqChanged = false;
    if (payload.requester.name !== undefined && payload.requester.name !== ticket.requester.name) {
      ticket.requester.name = payload.requester.name;
      reqChanged = true;
    }
    if (payload.requester.mobile !== undefined && payload.requester.mobile !== ticket.requester.mobile) {
      ticket.requester.mobile = payload.requester.mobile;
      reqChanged = true;
    }
    if (payload.requester.email !== undefined && payload.requester.email !== ticket.requester.email) {
      ticket.requester.email = payload.requester.email;
      reqChanged = true;
    }
    if (payload.requester.userType !== undefined && payload.requester.userType !== ticket.requester.userType) {
      ticket.requester.userType = payload.requester.userType;
      reqChanged = true;
    }
    if (payload.requester.rollNumber !== undefined && payload.requester.rollNumber !== ticket.requester.rollNumber) {
      ticket.requester.rollNumber = payload.requester.rollNumber;
      reqChanged = true;
    }
    if (reqChanged) {
      changes.push('Requester details updated');
    }
  }

  if (payload.eventDate !== undefined) {
    const newDate = payload.eventDate ? new Date(payload.eventDate) : null;
    const oldDateStr = ticket.eventDate ? new Date(ticket.eventDate).toISOString().slice(0, 10) : '';
    const newDateStr = newDate ? newDate.toISOString().slice(0, 10) : '';
    if (oldDateStr !== newDateStr) {
      ticket.eventDate = newDate;
      changes.push(`Event date changed to ${newDateStr || 'None'}`);
    }
  }

  if (payload.venue !== undefined && payload.venue !== ticket.venue) {
    changes.push(`Venue changed to "${payload.venue}"`);
    ticket.venue = payload.venue;
  }

  if (payload.eventTime !== undefined && payload.eventTime !== ticket.eventTime) {
    changes.push(`Event time changed to "${payload.eventTime}"`);
    ticket.eventTime = payload.eventTime;
  }

  if (payload.block !== undefined && payload.block !== ticket.block) {
    changes.push(`Block changed to "${payload.block || 'None'}"`);
    ticket.block = payload.block;
  }

  if (payload.floor !== undefined && payload.floor !== ticket.floor) {
    changes.push(`Floor changed to "${payload.floor || 'None'}"`);
    ticket.floor = payload.floor;
  }

  await ticket.save();

  if (changes.length > 0) {
    await logActivity({
      ticket,
      actor,
      action: 'updated',
      message: `Admin updated ticket details: ${changes.join(', ')}`,
    });
  }

  return populateTicket(Ticket.findById(ticket._id));
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

  const empDepts = getUserDepartmentIds(employee);
  if (!empDepts.includes(String(ticket.department))) {
    throw ApiError.badRequest('Employee must belong to the ticket department');
  }

  if (actor.role === 'manager') {
    const managerDepts = getUserDepartmentIds(actor);
    if (!managerDepts.includes(String(ticket.department))) {
      throw ApiError.forbidden('Cannot assign tickets outside your department(s)');
    }
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
  void notifyEmployeeOnAssignment(ticket, employee, actor);

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
  const empDepts = getUserDepartmentIds(employee);
  if (!empDepts.includes(String(ticket.department))) {
    throw ApiError.badRequest('Employee must belong to the ticket department');
  }
  if (actor.role === 'manager') {
    const managerDepts = getUserDepartmentIds(actor);
    if (!managerDepts.includes(String(ticket.department))) {
      throw ApiError.forbidden('Cannot reassign tickets outside your department(s)');
    }
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
  void notifyEmployeeOnAssignment(ticket, employee, actor);

  return populateTicket(Ticket.findById(ticket._id));
};
