import api from './api'
import type { ApiSuccess } from '../types'

export interface SendOtpResponse {
  sessionId: string
}

export interface VerifyOtpResponse {
  verified: boolean
}

export const otpService = {
  async sendOtp(mobile: string): Promise<SendOtpResponse> {
    const res = await api.post<ApiSuccess<SendOtpResponse>>('/otp/send', { mobile })
    return res.data.data
  },

  async verifyOtp(sessionId: string, otp: string): Promise<VerifyOtpResponse> {
    const res = await api.post<ApiSuccess<VerifyOtpResponse>>('/otp/verify', { sessionId, otp })
    return res.data.data
  },

  async sendEmailOtp(email: string): Promise<SendOtpResponse> {
    const res = await api.post<ApiSuccess<SendOtpResponse>>('/otp/send-email', { email })
    return res.data.data
  },

  async verifyEmailOtp(sessionId: string, otp: string): Promise<VerifyOtpResponse> {
    const res = await api.post<ApiSuccess<VerifyOtpResponse>>('/otp/verify-email', { sessionId, otp })
    return res.data.data
  },
}
