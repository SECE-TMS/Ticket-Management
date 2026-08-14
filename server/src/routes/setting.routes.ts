import { Router } from 'express';
import * as settingController from '../controllers/setting.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

// Public endpoint to get basic settings (e.g., whether OTP is required)
router.get('/public', settingController.getSettings);

// Protected routes (Admin only for updating)
router.use(authenticate);
router.get('/', settingController.getSettings);
router.put('/', requireRole('admin'), settingController.updateSettings);

export default router;
