import type { Response, NextFunction } from 'express';
import * as userService from '../services/user.service';
import { sendSuccess } from '../utils/apiResponse';
import type { AuthRequest } from '../types/auth';

export const list = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await userService.listUsers(req.query as Record<string, unknown>);
    return sendSuccess(res, { data });
  } catch (err) {
    next(err);
  }
};

export const listByDepartment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await userService.listByDepartment(req.params.deptId, req.user!);
    return sendSuccess(res, { data });
  } catch (err) {
    next(err);
  }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await userService.createUser(req.body, req.user!);
    return sendSuccess(res, { statusCode: 201, data, message: 'User created' });
  } catch (err) {
    next(err);
  }
};

export const createEmployee = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await userService.createEmployee(req.body, req.user!);
    return sendSuccess(res, { statusCode: 201, data, message: 'Employee created' });
  } catch (err) {
    next(err);
  }
};

export const getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await userService.getById(req.params.id, req.user!);
    return sendSuccess(res, { data });
  } catch (err) {
    next(err);
  }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await userService.updateUser(req.params.id, req.body, req.user!);
    return sendSuccess(res, { data, message: 'User updated' });
  } catch (err) {
    next(err);
  }
};

export const updateStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await userService.updateStatus(req.params.id, req.body.isActive);
    return sendSuccess(res, { data, message: 'User status updated' });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await userService.removeUser(req.params.id);
    return sendSuccess(res, { message: 'User deleted' });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await userService.changePassword(req.params.id, req.body, req.user!);
    return sendSuccess(res, { data, message: data.message });
  } catch (err) {
    next(err);
  }
};
