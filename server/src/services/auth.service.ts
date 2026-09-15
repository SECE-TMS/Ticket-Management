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

  const resetHtml = `
    <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 520px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
      <div style="background-color: #1e3a8a; padding: 24px; text-align: center; color: white;">
        <h2 style="margin: 0; font-size: 20px; font-weight: bold;">TMS Portal</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #fde047;">Password Reset Request</p>
      </div>
      <div style="padding: 28px; background-color: #ffffff;">
        <p style="font-size: 15px; color: #334155; margin-top: 0;">Hello,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">
          We received a request to reset your password for the Sri Eshwar Ticket Management System.
          Click the button below to set a new password. This link is valid for <strong>1 hour</strong>.
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${resetUrl}" target="_blank"
            style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 14px; padding: 13px 32px; border-radius: 10px; box-shadow: 0 2px 4px rgba(37,99,235,0.3);">
            Reset My Password &rarr;
          </a>
        </div>
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
          If you didn&rsquo;t request a password reset, you can safely ignore this email.<br/>
          This link will expire in 1 hour.
        </p>
        <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #cbd5e1; text-align: center;">
          Sri Eshwar College of Engineering &middot; Ticket Management System
        </div>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      to: user.email,
      subject: 'Password Reset - TMS Portal (Sri Eshwar)',
      text: `Reset your TMS Portal password using this link (valid 1 hour): ${resetUrl}`,
      html: resetHtml,
    });
  } catch (err: any) {
    // Log the error but don't expose it to the client — the reset token is already saved,
    // so the user can retry. Don't return a 500 just because SMTP is temporarily down.
    console.error('[forgotPassword] SMTP error:', err?.message || err);
  }

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
