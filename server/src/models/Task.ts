import mongoose, { Schema, type HydratedDocument, type Model } from 'mongoose';

export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface ITaskChecklistItem {
  _id?: mongoose.Types.ObjectId;
  title: string;
  completed: boolean;
  completedAt?: Date | null;
  completedBy?: mongoose.Types.ObjectId | null;
}

export interface ITaskAttachment {
  url: string;
  type: 'image' | 'audio' | 'video' | 'document';
  publicId?: string | null;
}

export interface ITaskActivity {
  actor?: mongoose.Types.ObjectId | null;
  action: string;
  message?: string;
  createdAt: Date;
}

export interface ITaskCompletionHistoryItem {
  _id?: mongoose.Types.ObjectId;
  completionRemarks?: string;
  completionProof?: ITaskAttachment | null;
  completedAt?: Date | null;
  completedBy?: mongoose.Types.ObjectId | null;
  actionType?: string;
  createdAt: Date;
}

export interface ITask {
  taskCode: string;
  title: string;
  description: string;
  department: mongoose.Types.ObjectId;
  assignedTo: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: Date | null;
  relatedTicket?: mongoose.Types.ObjectId | null;
  checklist: ITaskChecklistItem[];
  attachments: ITaskAttachment[];
  completionRemarks?: string;
  completionProof?: ITaskAttachment | null;
  completionHistory: ITaskCompletionHistoryItem[];
  completedAt?: Date | null;
  completedBy?: mongoose.Types.ObjectId | null;
  cancelledReason?: string;
  notificationPreferences: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
  };
  activities: ITaskActivity[];
  createdAt: Date;
  updatedAt: Date;
}

export type ITaskDocument = HydratedDocument<ITask>;

const taskChecklistItemSchema = new Schema<ITaskChecklistItem>(
  {
    title: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    completedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { _id: true }
);

const taskAttachmentSchema = new Schema<ITaskAttachment>(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'audio', 'video', 'document'], default: 'image' },
    publicId: { type: String, default: null },
  },
  { _id: false }
);

const taskCompletionHistorySchema = new Schema<ITaskCompletionHistoryItem>(
  {
    completionRemarks: { type: String, default: '' },
    completionProof: { type: taskAttachmentSchema, default: null },
    completedAt: { type: Date, default: null },
    completedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    actionType: { type: String, default: 'completed' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const taskActivitySchema = new Schema<ITaskActivity>(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    action: { type: String, required: true },
    message: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const taskSchema = new Schema<ITask>(
  {
    taskCode: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    priority: {
      type: String,
      enum: TASK_PRIORITIES,
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: 'pending',
      index: true,
    },
    dueDate: { type: Date, default: null },
    relatedTicket: {
      type: Schema.Types.ObjectId,
      ref: 'Ticket',
      default: null,
      index: true,
    },
    checklist: { type: [taskChecklistItemSchema], default: [] },
    attachments: { type: [taskAttachmentSchema], default: [] },
    completionRemarks: { type: String, default: '' },
    completionProof: { type: taskAttachmentSchema, default: null },
    completionHistory: { type: [taskCompletionHistorySchema], default: [] },
    completedAt: { type: Date, default: null },
    completedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    cancelledReason: { type: String, default: '' },
    notificationPreferences: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
    },
    activities: { type: [taskActivitySchema], default: [] },
  },
  {
    timestamps: true,
  }
);

taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ department: 1, status: 1 });
taskSchema.index({ createdAt: -1 });

const Task: Model<ITask> = mongoose.model<ITask>('Task', taskSchema);

export default Task;
