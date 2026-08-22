import express from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = express.Router();

router.use(authenticate);

router.get('/admin', requireRole('admin'), dashboardController.admin);
router.get('/manager', requireRole('manager'), dashboardController.manager);
router.get('/employee', requireRole('employee'), dashboardController.employee);

export default router;
