import express from 'express';
import authRoutes from './auth.routes';
import departmentRoutes from './department.routes';
import userRoutes from './user.routes';
import ticketRoutes from './ticket.routes';
import dashboardRoutes from './dashboard.routes';
import notificationRoutes from './notification.routes';
import otpRoutes from './otp.routes';
import settingRoutes from './setting.routes';

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' }, message: 'API healthy' });
});

router.use('/auth', authRoutes);
router.use('/departments', departmentRoutes);
router.use('/users', userRoutes);
router.use('/tickets', ticketRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);
router.use('/otp', otpRoutes);
router.use('/settings', settingRoutes);

export default router;


