import express from 'express';
import * as superadminController from '../controllers/superadmin.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

// All superadmin routes require authentication + superadmin role
// (The requireRole middleware with 'superadmin' only is fine since it won't be passed through)
router.use(authenticate);
router.use((req, res, next) => {
  if (!req.user || req.user.role !== 'superadmin') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Superadmin access required' },
    });
    return;
  }
  next();
});

router.get('/dashboard', superadminController.getDashboard);
router.get('/department-report', superadminController.getDepartmentReport);

// Admin management
router.get('/admins', superadminController.listAdmins);
router.post('/admins', superadminController.createAdmin);
router.put('/admins/:id', superadminController.updateAdmin);
router.patch('/admins/:id/status', superadminController.toggleAdminStatus);
router.put('/admins/:id/reset-password', superadminController.resetAdminPassword);

export default router;
