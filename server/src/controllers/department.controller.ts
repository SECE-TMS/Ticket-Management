import type { Response, NextFunction } from 'express';
import * as departmentService from '../services/department.service';
import { sendSuccess } from '../utils/apiResponse';
import type { AuthRequest } from '../types/auth';

export const listActive = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await departmentService.listActive();
    return sendSuccess(res, { data });
  } catch (err) {
    next(err);
  }
};

export const listAll = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await departmentService.listAll();
    return sendSuccess(res, { data });
  } catch (err) {
    next(err);
  }
};

export const getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await departmentService.getById(req.params.id, req.user!);
    return sendSuccess(res, { data });
  } catch (err) {
    next(err);
  }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await departmentService.create(req.body);
    return sendSuccess(res, { statusCode: 201, data, message: 'Department created' });
  } catch (err) {
    next(err);
  }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await departmentService.update(req.params.id, req.body);
    return sendSuccess(res, { data, message: 'Department updated' });
  } catch (err) {
    next(err);
  }
};

export const updateStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await departmentService.updateStatus(req.params.id, req.body.isActive);
    return sendSuccess(res, { data, message: 'Department status updated' });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await departmentService.remove(req.params.id);
    return sendSuccess(res, { message: 'Department deleted' });
  } catch (err) {
    next(err);
  }
};
