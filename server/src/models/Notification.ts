import mongoose, { Schema, type HydratedDocument, type Model } from 'mongoose';

export const TYPES = [
  'ticket_created',
  'ticket_assigned',
  'ticket_reassigned',
  'status_changed',
  'ticket_resolved',
  'ticket_closed',
  'ticket_reopened',
  'comment_added',
] as const;

export type NotificationType = (typeof TYPES)[number];

export interface INotification {
  recipient: mongoose.Types.ObjectId;
  ticket: mongoose.Types.ObjectId | null;
  type: NotificationType;
  message: string;
  isRead: boolean;
  channel: 'in_app' | 'email';
  createdAt: Date;
}

export type INotificationDocument = HydratedDocument<INotification>;

const notificationSchema = new Schema<INotification>({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  ticket: { type: Schema.Types.ObjectId, ref: 'Ticket', default: null },
  type: { type: String, enum: TYPES, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  channel: { type: String, enum: ['in_app', 'email'], default: 'in_app' },
  createdAt: { type: Date, default: Date.now },
});

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification: Model<INotification> = mongoose.model<INotification>(
  'Notification',
  notificationSchema
);

export default Notification;
