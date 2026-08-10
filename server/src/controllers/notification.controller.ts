import type { Response, NextFunction } from 'express';
import * as notificationService from '../services/notification.service';
import { sendSuccess } from '../utils/apiResponse';
import type { AuthRequest } from '../types/auth';

export const list = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await notificationService.listNotifications(
      req.user!._id,
      req.query as Record<string, unknown>
    );
    return sendSuccess(res, { data });
  } catch (err) {
    next(err);
  }
};

export const markRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await notificationService.markRead(req.params.id, req.user!._id);
    return sendSuccess(res, { data, message: 'Notification marked as read' });
  } catch (err) {
    next(err);
  }
};

export const markAllRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await notificationService.markAllRead(req.user!._id);
    return sendSuccess(res, { data, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};
