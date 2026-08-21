import type { Response, NextFunction } from 'express';
import * as dashboardService from '../services/dashboard.service';
import { sendSuccess } from '../utils/apiResponse';
import type { AuthRequest } from '../types/auth';

export const admin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await dashboardService.adminDashboard(req.query as Record<string, unknown>);
    return sendSuccess(res, { data });
  } catch (err) {
    next(err);
  }
};

export const manager = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await dashboardService.managerDashboard(req.user!);
    return sendSuccess(res, { data });
  } catch (err) {
    next(err);
  }
};

export const employee = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await dashboardService.employeeDashboard(req.user!);
    return sendSuccess(res, { data });
  } catch (err) {
    next(err);
  }
};
