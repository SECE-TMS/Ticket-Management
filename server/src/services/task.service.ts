import mongoose, { type Types } from 'mongoose';
import Task, { type ITask, type TaskPriority, type TaskStatus } from '../models/Task';
import Counter from '../models/Counter';
import User, { getUserDepartmentIds } from '../models/User';
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

import { notifyTaskAssignment } from './task/taskNotification.service';
export { notifyTaskAssignment };

/**
 * Creates and assigns a new task.
 */
export const createTask = async (
  data: CreateTaskInput,
  actor: { _id: Types.ObjectId | string; name: string; role?: string; department?: any; departments?: any }
) => {
  const taskCode = await generateTaskCode();

  const assigneeUser = await User.findById(data.assignedTo);
  if (!assigneeUser) {
    throw ApiError.notFound('Assignee user not found');
  }

  const assigneeDepts = getUserDepartmentIds(assigneeUser);
  let departmentId = data.department || assigneeUser.department;
  if (!departmentId && assigneeDepts.length > 0) {
    departmentId = assigneeDepts[0];
  }
  if (!departmentId) {
    const firstDept = await Department.findOne();
    if (firstDept) {
      departmentId = firstDept._id;
    } else {
      throw ApiError.badRequest('Department could not be determined for the selected assignee');
    }
  }

  // If manager is creating, check manager's departments
  if (actor.role === 'manager') {
    const managerDepts = getUserDepartmentIds(actor);
    if (managerDepts.length > 0 && !managerDepts.includes(String(departmentId))) {
      throw ApiError.forbidden('You can only create and assign tasks in your own department(s)');
    }
  }

  // Check if assignee belongs to this department
  if (assigneeDepts.length > 0 && !assigneeDepts.includes(String(departmentId))) {
    throw ApiError.badRequest('Assignee does not belong to the selected department');
  }

  const task = await Task.create({
    taskCode,
    title: data.title.trim(),
    description: data.description.trim(),
    department: departmentId,
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
        message: `Task created and assigned to ${assigneeUser.name} with priority ${data.priority || 'medium'}`,
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
  actor: { _id: Types.ObjectId | string; role: string; department?: Types.ObjectId | string | null; departments?: any }
) => {
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { isDeleted: { $ne: true } };

  // Role scoping
  if (actor.role === 'employee') {
    filter.assignedTo = actor._id;
  } else if (actor.role === 'manager') {
    const managerDepts = getUserDepartmentIds(actor);
    if (query.department && managerDepts.includes(String(query.department))) {
      filter.department = query.department;
    } else if (managerDepts.length === 1) {
      filter.department = managerDepts[0];
    } else if (managerDepts.length > 1) {
      filter.department = { $in: managerDepts };
    }
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

  const managerDeptIds = actor.role === 'manager'
    ? getUserDepartmentIds(actor).map((d) => new mongoose.Types.ObjectId(d))
    : [];

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
            ? { assignedTo: new mongoose.Types.ObjectId(String(actor._id)) }
            : actor.role === 'manager'
              ? (
                  query.department && managerDeptIds.some(d => d.toString() === String(query.department))
                    ? { department: new mongoose.Types.ObjectId(String(query.department)) }
                    : managerDeptIds.length === 1
                      ? { department: managerDeptIds[0] }
                      : managerDeptIds.length > 1
                        ? { department: { $in: managerDeptIds } }
                        : {}
                )
              : query.department
                ? { department: new mongoose.Types.ObjectId(String(query.department)) }
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
  actor: { _id: Types.ObjectId | string; role: string; department?: Types.ObjectId | string | null; departments?: any }
) => {
  const task = await Task.findOne({ _id: id, isDeleted: { $ne: true } })
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

  // Security check for manager
  if (actor.role === 'manager') {
    const managerDepts = getUserDepartmentIds(actor);
    const taskDeptId = (task.department as any)?._id?.toString() || task.department?.toString();
    if (managerDepts.length > 0 && taskDeptId && !managerDepts.includes(taskDeptId)) {
      throw ApiError.forbidden('You do not have access to tasks in this department');
    }
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
  const task = await Task.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!task) throw ApiError.notFound('Task not found');
  task.isDeleted = true;
  task.deletedAt = new Date();
  await task.save();
  return { success: true };
};
