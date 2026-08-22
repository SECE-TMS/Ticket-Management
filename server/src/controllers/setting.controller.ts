import type { Request, Response, NextFunction } from 'express';
import * as settingService from '../services/setting.service';
import { sendSuccess } from '../utils/apiResponse';

export const getSettings = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await settingService.getSettings();
    return sendSuccess(res, { data });
  } catch (err) {
    next(err);
  }
};

export const updateSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await settingService.updateSettings(req.body);
    return sendSuccess(res, { data, message: 'Settings updated successfully' });
  } catch (err) {
    next(err);
  }
};
