import express from 'express';
import * as departmentController from '../controllers/department.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import validate from '../middlewares/validate.middleware';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  statusSchema,
} from '../validators/department.validator';

const router = express.Router();

router.get('/', departmentController.listActive);

router.get('/all', authenticate, requireRole('admin'), departmentController.listAll);
router.post(
  '/',
  authenticate,
  requireRole('admin'),
  validate(createDepartmentSchema),
  departmentController.create
);
router.get(
  '/:id',
  authenticate,
  requireRole('admin', 'manager'),
  departmentController.getById
);
router.put(
  '/:id',
  authenticate,
  requireRole('admin'),
  validate(updateDepartmentSchema),
  departmentController.update
);
router.patch(
  '/:id/status',
  authenticate,
  requireRole('admin'),
  validate(statusSchema),
  departmentController.updateStatus
);
router.delete('/:id', authenticate, requireRole('admin'), departmentController.remove);

export default router;
