import ActivityLog from '../models/ActivityLog';
import Notification from '../models/Notification';
import type { ActivityAction } from '../models/ActivityLog';
import type { NotificationType } from '../models/Notification';
import type { Types } from 'mongoose';

type IdLike = Types.ObjectId | string | { _id: Types.ObjectId | string } | null | undefined;

const resolveId = (value: IdLike): Types.ObjectId | string | null => {
  if (!value) return null;
  if (typeof value === 'object' && '_id' in value) return value._id;
  return value;
};

export interface LogActivityInput {
  ticket: IdLike;
  actor?: IdLike;
  action: ActivityAction;
  fromStatus?: string | null;
  toStatus?: string | null;
  message?: string;
}

export const logActivity = async ({
  ticket,
  actor,
  action,
  fromStatus,
  toStatus,
  message,
}: LogActivityInput) => {
  return ActivityLog.create({
    ticket: resolveId(ticket)!,
    actor: resolveId(actor),
    action,
    fromStatus: fromStatus || null,
    toStatus: toStatus || null,
    message: message || '',
  });
};

export interface NotifyInput {
  recipient: IdLike;
  ticket?: IdLike;
  type: NotificationType;
  message: string;
  channel?: 'in_app' | 'email';
}

export const notify = async ({
  recipient,
  ticket,
  type,
  message,
  channel = 'in_app',
}: NotifyInput) => {
  if (!recipient) return null;
  return Notification.create({
    recipient: resolveId(recipient)!,
    ticket: resolveId(ticket),
    type,
    message,
    channel,
  });
};

export const notifyMany = async (
  recipients: IdLike[],
  payload: Omit<NotifyInput, 'recipient'>
): Promise<void> => {
  const unique = [
    ...new Set(recipients.filter(Boolean).map((r) => String(resolveId(r)))),
  ];
  await Promise.all(unique.map((id) => notify({ ...payload, recipient: id })));
};
