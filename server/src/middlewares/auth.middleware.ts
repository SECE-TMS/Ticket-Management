import type { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/generateToken';
import ApiError from '../utils/apiError';
import User from '../models/User';
import type { AuthRequest } from '../types/auth';

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const header = req.headers.authorization;
    let token: string | null = null;

    if (header && header.startsWith('Bearer ')) {
      token = header.slice(7);
    }

    if (!token) {
      throw ApiError.unauthorized('Access token required');
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch {
      throw ApiError.unauthorized('Invalid or expired access token', 'TOKEN_INVALID');
    }

    const user = await User.findById(decoded.sub);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('User not found or inactive');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      try {
        const decoded = verifyAccessToken(header.slice(7));
        const user = await User.findById(decoded.sub);
        if (user && user.isActive) req.user = user;
      } catch {
        // ignore invalid optional token
      }
    }
    next();
  } catch (err) {
    next(err);
  }
};
