import type { Types } from 'mongoose';
import Task, { type ITask, type TaskPriority, type TaskStatus } from '../models/Task';
import Counter from '../models/Counter';
import User from '../models/User';
import Department from '../models/Department';
import Notification from '../models/Notification';
import ApiError from '../utils/apiError';
import logger from '../utils/logger';
import { sendEmail } from '../config/email';
import { uploadBuffer, type UploadableFile } from '../utils/upload';

const generateTaskCode = async (): Promise<string> => {
  const counter = await Counter.findOneAndUpdate(
    { key: 'task_code' },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  const number = 1000 + (counter.seq || 1);
  return `TSK-${number}`;
};

export interface CreateTaskInput {
  title: string;
  description: string;
  department: string;
  assignedTo: string;
  priority?: TaskPriority;
  dueDate?: string | null;
  relatedTicket?: string | null;
  checklist?: Array<{ title: string; completed?: boolean }>;
  notificationPreferences?: {
    inApp?: boolean;
    email?: boolean;
    sms?: boolean;
  };
}

export interface TaskListQuery {
  page?: number;
  limit?: number;
  status?: TaskStatus | '';
  priority?: TaskPriority | '';
  department?: string;
  assignedTo?: string;
  search?: string;
  from?: string;
  to?: string;
}

/**
 * Dispatches multi-channel notifications (In-App, Email, SMS/WhatsApp) when a task is assigned or updated.
 */
export const notifyTaskAssignment = async (
  task: ITask & { _id: Types.ObjectId },
  actorName: string,
  isUpdate = false
) => {
  try {
    const employee = await User.findById(task.assignedTo).lean();
    if (!employee) return;

    const dept = await Department.findById(task.department).lean();
    const deptName = dept?.name || 'Department';
    const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
    const taskUrl = `${clientOrigin}/employee/tasks/${task._id}`;
    const actionLabel = isUpdate ? 'Task Updated' : 'New Task Assigned';

    // 1. In-App Notification
    if (task.notificationPreferences?.inApp !== false) {
      await Notification.create({
        recipient: employee._id,
        task: task._id,
        type: isUpdate ? 'task_updated' : 'task_assigned',
        message: `${actionLabel}: "${task.title}" (Priority: ${task.priority.toUpperCase()}) assigned by ${actorName}`,
        channel: 'in_app',
      });
      logger.info(`[task-notify-inapp] Dispatched to user ${employee.email} for task ${task.taskCode}`);
    }

    // 2. Email Notification
    if (task.notificationPreferences?.email !== false && employee.email) {
      const priorityColors: Record<string, string> = {
        urgent: '#dc2626',
        high: '#ea580c',
        medium: '#2563eb',
        low: '#16a34a',
      };
      const pColor = priorityColors[task.priority] || '#2563eb';
      const formattedDueDate = task.dueDate
        ? new Date(task.dueDate).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Not specified';

      const checklistHtml = task.checklist?.length
        ? `<div style="margin-top: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px;">
            <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: bold; color: #475569; text-transform: uppercase;">Checklist Subtasks (${task.checklist.length}):</p>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #334155;">
              ${task.checklist.map((c) => `<li style="margin-bottom: 4px;">${c.title}</li>`).join('')}
            </ul>
           </div>`
        : '';

      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <div style="background-color: #1e3a8a; padding: 24px; text-align: center; color: white;">
            <h2 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: -0.5px;">TMS Facility Portal</h2>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #fde047; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">📋 ${actionLabel}</p>
          </div>

          <div style="padding: 28px; background-color: #ffffff;">
            <p style="font-size: 15px; margin-top: 0; color: #334155;">Dear <strong>${employee.name}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">
              You have been assigned a specific work task by <strong>${actorName}</strong> for the <strong>${deptName}</strong> department.
            </p>

            <div style="background-color: #f1f5f9; border-left: 4px solid ${pColor}; padding: 16px; border-radius: 0 12px 12px 0; margin: 20px 0;">
              <p style="margin: 0; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b;">Task ID &amp; Title</p>
              <h3 style="margin: 4px 0 8px 0; font-size: 16px; color: #0f172a;">${task.taskCode}: ${task.title}</h3>
              
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px;">
                <tr>
                  <td style="padding: 4px 0; color: #64748b; width: 35%;">Priority:</td>
                  <td style="padding: 4px 0; font-weight: bold; color: ${pColor}; text-transform: uppercase;">${task.priority}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #64748b;">Due Deadline:</td>
                  <td style="padding: 4px 0; font-weight: bold; color: #1e293b;">${formattedDueDate}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #64748b;">Assigned By:</td>
                  <td style="padding: 4px 0; font-weight: bold; color: #1e293b;">${actorName}</td>
                </tr>
              </table>
            </div>

            <div style="margin-bottom: 20px;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase;">Instructions / Description:</p>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1e293b; background-color: #fafafa; border: 1px solid #f0f0f0; border-radius: 8px; padding: 12px; white-space: pre-line;">${task.description}</p>
            </div>

            ${checklistHtml}

            <div style="text-align: center; margin: 30px 0 10px 0;">
              <a href="${taskUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 10px; display: inline-block; box-shadow: 0 2px 4px rgba(37,99,235,0.3);">
                View Task &amp; Start Work →
              </a>
            </div>
          </div>

          <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
            This is an automated operational notification from TMS Portal.
          </div>
        </div>
      `;

      try {
        await sendEmail({
          to: employee.email,
          subject: `[TMS Task ${task.taskCode}] ${actionLabel}: ${task.title}`,
          html,
        });
        logger.info(`[task-notify-email] Sent assignment email to ${employee.email}`);
      } catch (e: any) {
        logger.warn(`[task-notify-email-error] ${e?.message}`);
      }
    }

    // 3. SMS Alert (if phone number is available)
    if (task.notificationPreferences?.sms !== false && employee.phone) {
      const sanitizedPhone = employee.phone.trim().replace(/\D/g, '').slice(-10);
      if (sanitizedPhone.length === 10) {
        const TWOFACTOR_API_KEY = process.env.TWOFACTOR_API_KEY || '40a61f6f-953e-11f1-9cb1-0200cd936042';
        const smsMessage = encodeURIComponent(
          `[TMS Task ${task.taskCode}] New task assigned: ${task.title.slice(0, 30)}. Priority: ${task.priority.toUpperCase()}. View at: ${taskUrl}`
        );
        try {
          const url = `https://2factor.in/API/V1/${TWOFACTOR_API_KEY}/SMS/${sanitizedPhone}/${smsMessage}`;
          await fetch(url);
          logger.info(`[task-notify-sms] Dispatched SMS to ${sanitizedPhone} for task ${task.taskCode}`);
        } catch (e: any) {
          logger.warn(`[task-notify-sms-error] Failed to send SMS: ${e?.message}`);
        }
      }
    }
  } catch (err: any) {
    logger.error(`[task-notification-error] ${err?.message}`);
  }
};

/**
 * Creates and assigns a new task.
 */
export const createTask = async (data: CreateTaskInput, actor: { _id: Types.ObjectId | string; name: string }) => {
  const taskCode = await generateTaskCode();

  const task = await Task.create({
    taskCode,
    title: data.title.trim(),
    description: data.description.trim(),
    department: data.department,
    assignedTo: data.assignedTo,
    assignedBy: actor._id,
    priority: data.priority || 'medium',
    status: 'pending',
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
    relatedTicket: data.relatedTicket || null,
    checklist: (data.checklist || []).map((c) => ({
      title: c.title.trim(),
      completed: Boolean(c.completed),
    })),
    notificationPreferences: {
      inApp: data.notificationPreferences?.inApp !== false,
      email: data.notificationPreferences?.email !== false,
      sms: data.notificationPreferences?.sms !== false,
    },
    activities: [
      {
        actor: actor._id as unknown as Types.ObjectId,
        action: 'task_created',
        message: `Task created and assigned to employee with priority ${data.priority || 'medium'}`,
        createdAt: new Date(),
      },
    ],
  });

  const populatedTask = await Task.findById(task._id)
    .populate('department', 'name')
    .populate('assignedTo', 'name email phone rollNumber avatarUrl')
    .populate('assignedBy', 'name email role')
    .populate('relatedTicket', 'ticketCode title complaintType status');

  // Trigger notifications
  void notifyTaskAssignment(task as any, actor.name, false);

  return populatedTask;
};

/**
 * List tasks with pagination, filters, and dashboard metrics.
 */
export const listTasks = async (
  query: TaskListQuery,
  actor: { _id: Types.ObjectId | string; role: string; department?: Types.ObjectId | string | null }
) => {
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};

  // Role scoping
  if (actor.role === 'employee') {
    filter.assignedTo = actor._id;
  } else if (actor.role === 'manager' && actor.department) {
    filter.department = actor.department;
  }

  // Explicit filters
  if (query.status) {
    filter.status = query.status;
  }
  if (query.priority) {
    filter.priority = query.priority;
  }
  if (query.department && (actor.role === 'admin' || actor.role === 'superadmin')) {
    filter.department = query.department;
  }
  if (query.assignedTo && actor.role !== 'employee') {
    filter.assignedTo = query.assignedTo;
  }
  if (query.search) {
    const s = query.search.trim();
    filter.$or = [
      { taskCode: { $regex: s, $options: 'i' } },
      { title: { $regex: s, $options: 'i' } },
      { description: { $regex: s, $options: 'i' } },
    ];
  }
  if (query.from || query.to) {
    const createdAtFilter: Record<string, Date> = {};
    if (query.from) createdAtFilter.$gte = new Date(query.from);
    if (query.to) createdAtFilter.$lte = new Date(query.to);
    filter.createdAt = createdAtFilter;
  }

  const [items, total, stats] = await Promise.all([
    Task.find(filter)
      .populate('department', 'name')
      .populate('assignedTo', 'name email phone avatarUrl')
      .populate('assignedBy', 'name email role')
      .populate('relatedTicket', 'ticketCode title status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Task.countDocuments(filter),
    Task.aggregate([
      {
        $match:
          actor.role === 'employee'
            ? { assignedTo: actor._id as unknown as Types.ObjectId }
            : actor.role === 'manager' && actor.department
              ? { department: actor.department as unknown as Types.ObjectId }
              : {},
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          in_progress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const summary = stats[0] || {
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
  };

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
    stats: summary,
  };
};

/**
 * Get single task by ID.
 */
export const getTaskById = async (
  id: string,
  actor: { _id: Types.ObjectId | string; role: string; department?: Types.ObjectId | string | null }
) => {
  const task = await Task.findById(id)
    .populate('department', 'name complaintTypes')
    .populate('assignedTo', 'name email phone rollNumber avatarUrl')
    .populate('assignedBy', 'name email role')
    .populate('completedBy', 'name email')
    .populate('completionHistory.completedBy', 'name email')
    .populate('relatedTicket', 'ticketCode title complaintType status priority requester')
    .populate('activities.actor', 'name role email');

  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  // Security check for employee
  if (actor.role === 'employee' && task.assignedTo._id.toString() !== actor._id.toString()) {
    throw ApiError.forbidden('You do not have access to this task');
  }

  return task;
};

/**
 * Update task details (Admin & Manager).
 */
export const updateTask = async (
  id: string,
  payload: Partial<CreateTaskInput>,
  actor: { _id: Types.ObjectId | string; name: string }
) => {
  const task = await Task.findById(id);
  if (!task) throw ApiError.notFound('Task not found');

  const prevAssignee = task.assignedTo.toString();

  if (payload.title) task.title = payload.title.trim();
  if (payload.description) task.description = payload.description.trim();
  if (payload.department) task.department = payload.department as unknown as Types.ObjectId;
  if (payload.assignedTo) task.assignedTo = payload.assignedTo as unknown as Types.ObjectId;
  if (payload.priority) task.priority = payload.priority;
  if (payload.dueDate !== undefined) {
    task.dueDate = payload.dueDate ? new Date(payload.dueDate) : null;
  }
  if (payload.checklist) {
    task.checklist = payload.checklist.map((c: any) => ({
      _id: c._id,
      title: c.title.trim(),
      completed: Boolean(c.completed),
    }));
  }

  task.activities.push({
    actor: actor._id as unknown as Types.ObjectId,
    action: 'task_updated',
    message: `Task details updated by ${actor.name}`,
    createdAt: new Date(),
  });

  await task.save();

  const isReassigned = Boolean(payload.assignedTo && payload.assignedTo.toString() !== prevAssignee);
  void notifyTaskAssignment(task as any, actor.name, isReassigned);

  return Task.findById(task._id)
    .populate('department', 'name')
    .populate('assignedTo', 'name email phone avatarUrl')
    .populate('assignedBy', 'name email role')
    .populate('completedBy', 'name email')
    .populate('completionHistory.completedBy', 'name email')
    .populate('relatedTicket', 'ticketCode title status');
};

/**
 * Update task status (Pending -> In Progress -> Completed / Cancelled).
 */
export const updateTaskStatus = async (
  id: string,
  payload: {
    status: TaskStatus;
    completionRemarks?: string;
    cancelledReason?: string;
  },
  file: UploadableFile | undefined | null,
  actor: { _id: Types.ObjectId | string; name: string; role: string }
) => {
  const task = await Task.findById(id);
  if (!task) throw ApiError.notFound('Task not found');

  const prevStatus = task.status;
  task.status = payload.status;

  if (payload.status === 'completed') {
    task.completedAt = new Date();
    task.completedBy = actor._id as unknown as Types.ObjectId;
    if (payload.completionRemarks) {
      task.completionRemarks = payload.completionRemarks.trim();
    }
    if (file) {
      const uploaded = await uploadBuffer(file, 'task_proofs');
      if (uploaded) {
        task.completionProof = uploaded;
      }
    }

    if (!task.completionHistory) {
      task.completionHistory = [];
    }
    task.completionHistory.push({
      completionRemarks: task.completionRemarks || '',
      completionProof: task.completionProof || null,
      completedAt: new Date(),
      completedBy: actor._id as unknown as Types.ObjectId,
      actionType: 'completed',
      createdAt: new Date(),
    });
  } else if (payload.status === 'cancelled') {
    task.cancelledReason = payload.cancelledReason?.trim() || '';
  }

  task.activities.push({
    actor: actor._id as unknown as Types.ObjectId,
    action: `status_${payload.status}`,
    message: `Status changed from ${prevStatus} to ${payload.status}${
      payload.completionRemarks ? `: "${payload.completionRemarks}"` : ''
    }`,
    createdAt: new Date(),
  });

  await task.save();

  // Notify assignedBy (Admin/Manager) when task status changes
  try {
    const creator = await User.findById(task.assignedBy).lean();
    if (creator && creator._id.toString() !== actor._id.toString()) {
      await Notification.create({
        recipient: creator._id,
        task: task._id,
        type: payload.status === 'completed' ? 'task_completed' : 'task_updated',
        message: `Task ${task.taskCode} ("${task.title}") was marked as ${payload.status.toUpperCase()} by ${actor.name}`,
        channel: 'in_app',
      });
    }
  } catch (e: any) {
    logger.warn(`[task-status-notify-error] ${e?.message}`);
  }

  return Task.findById(task._id)
    .populate('department', 'name')
    .populate('assignedTo', 'name email phone avatarUrl')
    .populate('assignedBy', 'name email role')
    .populate('completedBy', 'name email')
    .populate('completionHistory.completedBy', 'name email')
    .populate('relatedTicket', 'ticketCode title status');
};

/**
 * Toggle individual checklist item.
 */
export const toggleChecklistItem = async (
  taskId: string,
  itemId: string,
  completed: boolean,
  actor: { _id: Types.ObjectId | string; name: string }
) => {
  const task = await Task.findById(taskId);
  if (!task) throw ApiError.notFound('Task not found');

  const item = task.checklist.find((c) => c._id?.toString() === itemId);
  if (!item) throw ApiError.notFound('Checklist item not found');

  item.completed = completed;
  item.completedAt = completed ? new Date() : null;
  item.completedBy = completed ? (actor._id as unknown as Types.ObjectId) : null;

  task.activities.push({
    actor: actor._id as unknown as Types.ObjectId,
    action: 'checklist_toggle',
    message: `Checklist item "${item.title}" marked as ${completed ? 'completed' : 'incomplete'} by ${actor.name}`,
    createdAt: new Date(),
  });

  await task.save();
  return task;
};

/**
 * Delete a task (Admin only).
 */
export const deleteTask = async (id: string) => {
  const task = await Task.findByIdAndDelete(id);
  if (!task) throw ApiError.notFound('Task not found');
  await Notification.deleteMany({ task: task._id });
  return { success: true };
};
