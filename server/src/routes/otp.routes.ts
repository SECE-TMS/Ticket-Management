import express from 'express';
import * as otpController from '../controllers/otp.controller';

const router = express.Router();

router.post('/send', otpController.sendOtp);
router.post('/verify', otpController.verifyOtp);
router.post('/send-email', otpController.sendEmailOtp);
router.post('/verify-email', otpController.verifyEmailOtp);

export default router;
