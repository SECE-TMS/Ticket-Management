import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import ApiError from '../utils/apiError';
import { sendError } from '../utils/apiResponse';
import logger from '../utils/logger';

export const notFound = (req: Request, _res: Response, next: NextFunction): void => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  void next;

  if (err instanceof ZodError) {
    const message = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    return sendError(res, {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message,
    });
  }

  const error = err as {
    name?: string;
    message?: string;
    statusCode?: number;
    code?: string | number;
    keyPattern?: Record<string, unknown>;
    stack?: string;
  };

  if (error.name === 'ValidationError') {
    return sendError(res, {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: error.message || 'Validation error',
    });
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || 'field';
    return sendError(res, {
      statusCode: 409,
      code: 'DUPLICATE',
      message: `${field} already exists`,
    });
  }

  if (error.name === 'CastError') {
    return sendError(res, {
      statusCode: 400,
      code: 'INVALID_ID',
      message: 'Invalid resource id',
    });
  }

  const statusCode = error.statusCode || 500;
  const code = error.code || (statusCode === 500 ? 'INTERNAL_ERROR' : 'ERROR');
  const message = error.message || 'Internal server error';

  if (statusCode >= 500) {
    logger.error(message, error.stack || error);
  }

  return sendError(res, { statusCode, code, message });
};
