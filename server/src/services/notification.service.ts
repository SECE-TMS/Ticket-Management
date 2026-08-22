import Notification from '../models/Notification';
import ApiError from '../utils/apiError';
import type { Types } from 'mongoose';

export const listNotifications = async (
  userId: Types.ObjectId | string,
  query: Record<string, unknown> = {}
) => {
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 20, 100);
  const skip = (page - 1) * limit;
  const filter: Record<string, unknown> = { recipient: userId };
  if (query.isRead === 'true') filter.isRead = true;
  if (query.isRead === 'false') filter.isRead = false;

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .populate('ticket', 'ticketCode status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: userId, isRead: false }),
  ]);

  return {
    items,
    unreadCount,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  };
};

export const markRead = async (id: string, userId: Types.ObjectId | string) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: id, recipient: userId },
    { isRead: true },
    { new: true }
  );
  if (!notification) throw ApiError.notFound('Notification not found');
  return notification;
};

export const markAllRead = async (userId: Types.ObjectId | string) => {
  const result = await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true }
  );
  return { modifiedCount: result.modifiedCount };
};
