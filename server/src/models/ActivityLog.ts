import mongoose, { Schema, type HydratedDocument, type Model } from 'mongoose';

export const ACTIONS = [
  'created',
  'assigned',
  'status_changed',
  'commented',
  'reopened',
  'closed',
  'feedback_submitted',
] as const;

export type ActivityAction = (typeof ACTIONS)[number];

export interface IActivityLog {
  ticket: mongoose.Types.ObjectId;
  actor: mongoose.Types.ObjectId | null;
  action: ActivityAction;
  fromStatus: string | null;
  toStatus: string | null;
  message: string;
  createdAt: Date;
}

export type IActivityLogDocument = HydratedDocument<IActivityLog>;

const activityLogSchema = new Schema<IActivityLog>({
  ticket: {
    type: Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true,
    index: true,
  },
  actor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  action: { type: String, enum: ACTIONS, required: true },
  fromStatus: { type: String, default: null },
  toStatus: { type: String, default: null },
  message: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

activityLogSchema.index({ ticket: 1, createdAt: -1 });

const ActivityLog: Model<IActivityLog> = mongoose.model<IActivityLog>(
  'ActivityLog',
  activityLogSchema
);

export default ActivityLog;
