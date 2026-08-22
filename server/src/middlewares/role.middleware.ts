import type { Response, NextFunction } from 'express';
import ApiError from '../utils/apiError';
import type { AuthRequest } from '../types/auth';
import type { UserRole } from '../models/User';

export const requireRole =
  (...roles: UserRole[]) =>
  (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(ApiError.forbidden('Insufficient permissions'));
      return;
    }
    next();
  };

/**
 * Ensure manager can only access their own department resources.
 * Expects department id in req.params.id, req.params.deptId, or body.department
 */
export const requireDepartmentScope =
  (paramKeys: string[] = ['id', 'deptId']) =>
  (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }
    if (req.user.role === 'admin') {
      next();
      return;
    }

    if (req.user.role === 'manager') {
      const userDept = req.user.department ? String(req.user.department) : null;
      if (!userDept) {
        next(ApiError.forbidden('Manager has no department assigned'));
        return;
      }

      let targetDept: string | null = null;
      for (const key of paramKeys) {
        if (req.params[key]) {
          targetDept = String(req.params[key]);
          break;
        }
      }
      if (!targetDept && req.body && req.body.department) {
        targetDept = String(req.body.department);
      }
      if (!targetDept && req.query && req.query.department) {
        targetDept = String(req.query.department);
      }

      if (targetDept && targetDept !== userDept) {
        next(ApiError.forbidden('Access limited to your department'));
        return;
      }
    }

    next();
  };
