import mongoose, { Schema, type HydratedDocument, type Model } from 'mongoose';

export const STATUSES = [
  'new',
  'assigned',
  'accepted',
  'in_progress',
  'resolved',
  'closed',
  'reopened',
] as const;

export const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

export const OPEN_STATUSES = ['new', 'assigned', 'accepted', 'in_progress', 'reopened'] as const;

export type TicketStatus = (typeof STATUSES)[number];
export type TicketPriority = (typeof PRIORITIES)[number];
export type OpenTicketStatus = (typeof OPEN_STATUSES)[number];

export interface IAttachment {
  url: string;
  type: 'image' | 'audio';
  publicId: string | null;
}

export interface ITicketComment {
  author: mongoose.Types.ObjectId;
  message: string;
  createdAt: Date;
}

export interface ITicketResolution {
  remarks: string;
  attachment: IAttachment | null;
  resolvedAt: Date | null;
}

export interface IRequester {
  name: string;
  mobile: string;
  email: string;
}

export interface ITicket {
  ticketCode: string;
  requester: IRequester;
  department: mongoose.Types.ObjectId;
  complaintType: string;
  description: string;
  userAttachment: IAttachment | null;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo: mongoose.Types.ObjectId | null;
  assignedBy: mongoose.Types.ObjectId | null;
  expectedResolutionAt: Date | null;
  resolution: ITicketResolution;
  closedBy: mongoose.Types.ObjectId | null;
  closedAt: Date | null;
  reopenCount: number;
  comments: ITicketComment[];
  createdAt: Date;
  updatedAt: Date;
}

export type ITicketDocument = HydratedDocument<ITicket>;

const attachmentSchema = new Schema<IAttachment>(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'audio'], required: true },
    publicId: { type: String, default: null },
  },
  { _id: false }
);

const ticketSchema = new Schema<ITicket>(
  {
    ticketCode: { type: String, required: true, unique: true, index: true },
    requester: {
      name: { type: String, required: true, trim: true },
      mobile: { type: String, required: true, trim: true },
      email: { type: String, trim: true, default: '' },
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },
    complaintType: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    userAttachment: { type: attachmentSchema, default: null },
    priority: { type: String, enum: PRIORITIES, default: 'medium', index: true },
    status: { type: String, enum: STATUSES, default: 'new', index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    expectedResolutionAt: { type: Date, default: null },
    resolution: {
      remarks: { type: String, default: '' },
      attachment: { type: attachmentSchema, default: null },
      resolvedAt: { type: Date, default: null },
    },
    closedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    closedAt: { type: Date, default: null },
    reopenCount: { type: Number, default: 0 },
    comments: [
      {
        author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        message: { type: String, required: true, trim: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

ticketSchema.index({ status: 1, department: 1 });
ticketSchema.index({ 'requester.mobile': 1, ticketCode: 1 });
ticketSchema.index({ createdAt: -1 });

const Ticket: Model<ITicket> = mongoose.model<ITicket>('Ticket', ticketSchema);

export default Ticket;
