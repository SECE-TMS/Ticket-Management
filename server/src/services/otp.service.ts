import ApiError from '../utils/apiError';

const TWOFACTOR_API_KEY = process.env.TWOFACTOR_API_KEY || '40a61f6f-953e-11f1-9cb1-0200cd936042';

interface TwoFactorResponse {
  Status: string;
  Details: string;
}

export const sendOtp = async (mobile: string): Promise<{ sessionId: string }> => {
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
  if (!sessionId || !otp) {
    throw ApiError.badRequest('Session ID and OTP are required');
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
