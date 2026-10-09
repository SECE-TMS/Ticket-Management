import type { Response, NextFunction } from 'express';
import * as taskService from '../services/task.service';
import { sendSuccess } from '../utils/apiResponse';
import type { AuthRequest } from '../types/auth';

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await taskService.createTask(req.body, {
      _id: req.user!._id,
      name: req.user!.name,
    });
    return sendSuccess(res, {
      statusCode: 201,
      data,
      message: 'Task created and assigned successfully',
    });
  } catch (err) {
    next(err);
  }
};

export const list = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await taskService.listTasks(req.query as taskService.TaskListQuery, {
      _id: req.user!._id,
      role: req.user!.role,
      department: req.user!.department as any,
    });
    return sendSuccess(res, { data });
  } catch (err) {
    next(err);
  }
};

export const getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await taskService.getTaskById(req.params.id, {
      _id: req.user!._id,
      role: req.user!.role,
      department: req.user!.department as any,
    });
    return sendSuccess(res, { data });
  } catch (err) {
    next(err);
  }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await taskService.updateTask(req.params.id, req.body, {
      _id: req.user!._id,
      name: req.user!.name,
    });
    return sendSuccess(res, { data, message: 'Task updated successfully' });
  } catch (err) {
    next(err);
  }
};

export const updateStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const file = req.file
      ? {
          mimetype: req.file.mimetype,
          size: req.file.size,
          buffer: req.file.buffer,
          originalname: req.file.originalname,
        }
      : null;

    const data = await taskService.updateTaskStatus(
      req.params.id,
      req.body,
      file,
      {
        _id: req.user!._id,
        name: req.user!.name,
        role: req.user!.role,
      }
    );
    return sendSuccess(res, { data, message: `Task status updated to ${req.body.status}` });
  } catch (err) {
    next(err);
  }
};

export const toggleChecklist = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await taskService.toggleChecklistItem(
      req.params.id,
      req.params.itemId,
      req.body.completed,
      {
        _id: req.user!._id,
        name: req.user!.name,
      }
    );
    return sendSuccess(res, { data, message: 'Checklist updated' });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await taskService.deleteTask(req.params.id);
    return sendSuccess(res, { data, message: 'Task deleted successfully' });
  } catch (err) {
    next(err);
  }
};
