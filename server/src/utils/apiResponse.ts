import type { Response } from 'express';

interface SuccessOptions {
  statusCode?: number;
  data?: unknown;
  message?: string;
}

interface ErrorOptions {
  statusCode?: number;
  code?: string | number;
  message?: string;
}

export const sendSuccess = (
  res: Response,
  { statusCode = 200, data = null, message = 'Success' }: SuccessOptions = {}
): Response => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
};

export const sendError = (
  res: Response,
  { statusCode = 500, code = 'ERROR', message = 'Error' }: ErrorOptions = {}
): Response => {
  return res.status(statusCode).json({
    success: false,
    error: { code, message },
  });
};
