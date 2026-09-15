import ApiError from '../utils/apiError';
import { getSettings } from './setting.service';
import { sendEmail } from '../config/email';
import logger from '../utils/logger';

const TWOFACTOR_API_KEY = process.env.TWOFACTOR_API_KEY || '40a61f6f-953e-11f1-9cb1-0200cd936042';

interface TwoFactorResponse {
  Status: string;
  Details: string;
}

// In-memory Email OTP sessions store
interface EmailOtpSession {
  email: string;
  otp: string;
  expiresAt: number;
}
const emailOtpSessions = new Map<string, EmailOtpSession>();

// Cleanup expired OTP sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, session] of emailOtpSessions.entries()) {
    if (session.expiresAt < now) {
      emailOtpSessions.delete(key);
    }
  }
}, 5 * 60 * 1000);

export const sendOtp = async (mobile: string): Promise<{ sessionId: string }> => {
  const settings = await getSettings();
  if (!settings.smsOtpEnabled) {
    return { sessionId: 'BYPASS_OTP_DISABLED' };
  }

  const sanitizedMobile = mobile.trim();
  if (!/^\d{10}$/.test(sanitizedMobile)) {
    throw ApiError.badRequest('Invalid 10-digit mobile number');
  }

  // Append /OTPSMS to explicitly mandate SMS Text Message delivery instead of Voice Call fallback
  let url = `https://2factor.in/API/V1/${TWOFACTOR_API_KEY}/SMS/${sanitizedMobile}/AUTOGEN/OTPSMS`;

  try {
    let res = await fetch(url);
    let data = (await res.json()) as TwoFactorResponse;

    if (data.Status !== 'Success') {
      // Fallback to /AUTOGEN/SMS template if OTPSMS is not configured on account
      url = `https://2factor.in/API/V1/${TWOFACTOR_API_KEY}/SMS/${sanitizedMobile}/AUTOGEN/SMS`;
      res = await fetch(url);
      data = (await res.json()) as TwoFactorResponse;
    }

    if (data.Status === 'Success') {
      return { sessionId: data.Details };
    }

    throw ApiError.badRequest(data.Details || 'Failed to send SMS OTP via 2Factor');
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    const message = err instanceof Error ? err.message : 'Error sending OTP';
    console.error('2Factor OTP Send Error:', err);
    throw ApiError.internal(message);
  }
};

export const verifyOtp = async (sessionId: string, otp: string): Promise<boolean> => {
  const settings = await getSettings();
  if (!settings.smsOtpEnabled || sessionId === 'BYPASS_OTP_DISABLED') {
    return true;
  }

  if (!sessionId || !otp) {
    throw ApiError.badRequest('Session ID and OTP are required');
  }

  // Handle Email OTP verification if sessionId is an email OTP session
  if (sessionId.startsWith('EMAIL_OTP_')) {
    return verifyEmailOtp(sessionId, otp);
  }

  const sanitizedOtp = otp.trim();
  const url = `https://2factor.in/API/V1/${TWOFACTOR_API_KEY}/SMS/VERIFY/${sessionId}/${sanitizedOtp}`;

  try {
    const res = await fetch(url);
    const data = (await res.json()) as TwoFactorResponse;

    if (data.Status === 'Success' && data.Details === 'OTP Matched') {
      return true;
    }

    if (data.Status === 'Error' || data.Details === 'OTP Mismatch') {
      throw ApiError.badRequest('Invalid or expired OTP');
    }

    throw ApiError.badRequest(data.Details || 'OTP verification failed');
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    const message = err instanceof Error ? err.message : 'Error verifying OTP';
    console.error('2Factor OTP Verify Error:', err);
    throw ApiError.internal(message);
  }
};

/**
 * Generate & Send 6-Digit Numeric Email OTP
 */
export const sendEmailOtp = async (email: string): Promise<{ sessionId: string }> => {
  const settings = await getSettings();
  if (settings.emailMode !== 'otp_required' && !settings.emailOtpEnabled) {
    return { sessionId: 'BYPASS_EMAIL_OTP_DISABLED' };
  }

  const sanitizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
    throw ApiError.badRequest('Invalid email address format');
  }

  // Generate 6-digit numeric OTP (  583920)
  const numericOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const sessionId = `EMAIL_OTP_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

  emailOtpSessions.set(sessionId, { email: sanitizedEmail, otp: numericOtp, expiresAt });

  const subject = `Your TMS Portal Email Verification Code: ${numericOtp}`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
      <div style="background-color: #1e3a8a; padding: 24px; text-align: center; color: white;">
        <h2 style="margin: 0; font-size: 20px; font-weight: bold;">TMS Verification</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #fde047;">Sri Eshwar Ticket Management System</p>
      </div>

      <div style="padding: 24px; text-align: center; background-color: #ffffff;">
        <p style="font-size: 14px; color: #475569; margin-top: 0;">
          Use the following 6-digit numeric verification code to verify your email address:
        </p>

        <div style="background-color: #f1f5f9; border: 2px dashed #2563eb; border-radius: 12px; padding: 18px; margin: 20px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1e3a8a;">
            ${numericOtp}
          </span>
        </div>

        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">
          This code is valid for 10 minutes. Please do not share this OTP with anyone.
        </p>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      to: sanitizedEmail,
      subject,
      html,
      text: `Your TMS Portal Email Verification Code is: ${numericOtp} (Valid for 10 minutes).`,
    });
    logger.info(`[EMAIL-OTP-SENT] To: ${sanitizedEmail}`);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    // SMTP failed — OTP is still valid in-memory. Log it prominently so admin can relay it manually.
    logger.error(
      `[EMAIL-OTP-SMTP-FAILED] Could not deliver OTP to ${sanitizedEmail}: ${errorMsg}. ` +
      `OTP for manual relay (DEV ONLY): ${numericOtp}`
    );
    // Don't throw — let the session exist so verify still works if the email eventually arrives
    // or admin relays the code. The client will show "OTP sent" but the user should check spam.
  }

  return { sessionId };
};

/**
 * Verify 6-Digit Numeric Email OTP
 */
export const verifyEmailOtp = async (sessionId: string, otp: string): Promise<boolean> => {
  const settings = await getSettings();
  if (settings.emailMode !== 'otp_required' && !settings.emailOtpEnabled) {
    return true;
  }

  if (sessionId === 'BYPASS_EMAIL_OTP_DISABLED') {
    return true;
  }

  if (!sessionId || !otp) {
    throw ApiError.badRequest('Session ID and OTP code are required');
  }

  const session = emailOtpSessions.get(sessionId);
  if (!session) {
    throw ApiError.badRequest('Invalid or expired Email OTP session. Please request a new OTP.');
  }

  if (Date.now() > session.expiresAt) {
    emailOtpSessions.delete(sessionId);
    throw ApiError.badRequest('Email OTP has expired. Please request a new code.');
  }

  const sanitizedOtp = otp.trim();
  if (session.otp !== sanitizedOtp) {
    throw ApiError.badRequest('Invalid 6-digit OTP code. Please check your email and try again.');
  }

  // OTP verified successfully! Remove session.
  emailOtpSessions.delete(sessionId);
  return true;
};

