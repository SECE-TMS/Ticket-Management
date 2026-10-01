import type { Response, NextFunction } from 'express';
import * as superadminService from '../services/superadmin.service';
import { sendSuccess } from '../utils/apiResponse';
import type { AuthRequest } from '../types/auth';

export const getDashboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await superadminService.getSuperAdminDashboard();
    return sendSuccess(res, { data });
  } catch (err) {
    next(err);
  }
};

export const getDepartmentReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await superadminService.getDepartmentReport();
    return sendSuccess(res, { data });
  } catch (err) {
    next(err);
  }
};

export const listAdmins = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await superadminService.listAdmins(req.query as Record<string, unknown>);
    return sendSuccess(res, { data });
  } catch (err) {
    next(err);
  }
};

export const createAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await superadminService.createAdmin(req.body, req.user!);
    return sendSuccess(res, { statusCode: 201, data, message: 'Admin created successfully' });
  } catch (err) {
    next(err);
  }
};

export const updateAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await superadminService.updateAdmin(req.params.id, req.body, req.user!);
    return sendSuccess(res, { data, message: 'Admin updated successfully' });
  } catch (err) {
    next(err);
  }
};

export const toggleAdminStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await superadminService.toggleAdminStatus(
      req.params.id,
      req.body.isActive,
      req.user!
    );
    return sendSuccess(res, { data, message: 'Admin status updated' });
  } catch (err) {
    next(err);
  }
};

export const resetAdminPassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await superadminService.resetAdminPassword(
      req.params.id,
      req.body.newPassword,
      req.user!
    );
    return sendSuccess(res, { data, message: data.message });
  } catch (err) {
    next(err);
  }
};
