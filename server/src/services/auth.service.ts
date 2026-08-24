import crypto from 'crypto';
import type { CookieOptions } from 'express';
import User, { type IUserDocument } from '../models/User';
import ApiError from '../utils/apiError';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateResetToken,
  verifyResetToken,
} from '../utils/generateToken';
import { sendEmail } from '../config/email';

const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

export const cookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/v1/auth',
});

const issueTokens = async (user: IUserDocument) => {
  const payload = { sub: String(user._id), role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};

export const login = async ({ email, password }: { email: string; password: string }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+password +loginAttempts +lockUntil +refreshToken'
  );

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  if (user.isLocked()) {
    throw ApiError.tooManyRequests(
      'Account locked due to failed login attempts. Try again later.',
      'ACCOUNT_LOCKED'
    );
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Account is deactivated', 'ACCOUNT_INACTIVE');
  }

  const match = await user.comparePassword(password);
  if (!match) {
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    if (user.loginAttempts >= MAX_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_MS);
      user.loginAttempts = 0;
    }
    await user.save({ validateBeforeSave: false });
    throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  user.loginAttempts = 0;
  user.lockUntil = null;
  const tokens = await issueTokens(user);

  const populated = await User.findById(user._id).populate('department', 'name');
  if (!populated) throw ApiError.notFound('User not found');

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: populated.toSafeObject(),
  };
};

export const refresh = async (refreshToken: string | undefined) => {
  if (!refreshToken) throw ApiError.unauthorized('Refresh token required');

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token', 'TOKEN_INVALID');
  }

  const user = await User.findById(decoded.sub).select('+refreshToken');
  if (!user || !user.isActive || user.refreshToken !== refreshToken) {
    throw ApiError.unauthorized('Invalid refresh token', 'TOKEN_INVALID');
  }

  const tokens = await issueTokens(user);
  return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
};

export const logout = async (userId?: string | unknown) => {
  if (!userId) return;
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};

export const me = async (userId: string | unknown) => {
  const user = await User.findById(userId).populate('department', 'name complaintTypes slaHours');
  if (!user) throw ApiError.notFound('User not found');
  return user.toSafeObject();
};

export const forgotPassword = async ({ email }: { email: string }) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return { message: 'If that email exists, a reset link has been sent' };
  }

  const resetToken = generateResetToken({ sub: String(user._id), purpose: 'reset' });
  const hashed = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetToken = hashed;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  const rawClientUrl = process.env.CLIENT_URL || 'https://tms.sece.ac.in';
  const clientUrl = rawClientUrl.split(',')[0].trim().replace(/\/+$/, '');
  const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

  await sendEmail({
    to: user.email,
    subject: 'Password Reset - Ticket Management System',
    text: `Reset your password using this link (valid 1 hour): ${resetUrl}`,
    html: `<p>Reset your password using this link (valid 1 hour):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });

  return { message: 'If that email exists, a reset link has been sent' };
};

export const resetPassword = async (token: string, { password }: { password: string }) => {
  let decoded;
  try {
    decoded = verifyResetToken(token);
  } catch {
    throw ApiError.badRequest('Invalid or expired reset token', 'RESET_TOKEN_INVALID');
  }

  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    _id: decoded.sub,
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    throw ApiError.badRequest('Invalid or expired reset token', 'RESET_TOKEN_INVALID');
  }

  user.password = password;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  user.refreshToken = null;
  await user.save();

  return { message: 'Password reset successful' };
};
