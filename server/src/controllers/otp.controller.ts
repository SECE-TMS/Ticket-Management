import type { Request, Response, NextFunction } from 'express';
import * as otpService from '../services/otp.service';
import { sendSuccess } from '../utils/apiResponse';

export const sendOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mobile } = req.body;
    const data = await otpService.sendOtp(mobile);
    return sendSuccess(res, { data, message: 'OTP sent successfully' });
  } catch (err) {
    next(err);
  }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, otp } = req.body;
    const isVerified = await otpService.verifyOtp(sessionId, otp);
    return sendSuccess(res, { data: { verified: isVerified }, message: 'OTP verified successfully' });
  } catch (err) {
    next(err);
  }
};

export const sendEmailOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const data = await otpService.sendEmailOtp(email);
    return sendSuccess(res, { data, message: '6-digit Email OTP sent successfully' });
  } catch (err) {
    next(err);
  }
};

export const verifyEmailOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, otp } = req.body;
    const isVerified = await otpService.verifyEmailOtp(sessionId, otp);
    return sendSuccess(res, { data: { verified: isVerified }, message: 'Email OTP verified successfully' });
  } catch (err) {
    next(err);
  }
};
