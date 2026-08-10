import type { Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { sendSuccess } from '../utils/apiResponse';
import type { AuthRequest } from '../types/auth';

export const login = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await authService.login(req.body);
    res.cookie('refreshToken', result.refreshToken, authService.cookieOptions());
    return sendSuccess(res, {
      data: { accessToken: result.accessToken, user: result.user },
      message: 'Login successful',
    });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    const result = await authService.refresh(token);
    res.cookie('refreshToken', result.refreshToken, authService.cookieOptions());
    return sendSuccess(res, {
      data: { accessToken: result.accessToken },
      message: 'Token refreshed',
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await authService.logout(req.user?._id);
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    return sendSuccess(res, { message: 'Logged out' });
  } catch (err) {
    next(err);
  }
};

export const me = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await authService.me(req.user!._id);
    return sendSuccess(res, { data: user });
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await authService.forgotPassword(req.body);
    return sendSuccess(res, { data: result, message: result.message });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await authService.resetPassword(req.params.token, req.body);
    return sendSuccess(res, { data: result, message: result.message });
  } catch (err) {
    next(err);
  }
};
