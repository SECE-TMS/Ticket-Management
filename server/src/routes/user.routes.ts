import express from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import validate from '../middlewares/validate.middleware';
import {
  createUserSchema,
  createEmployeeSchema,
  updateUserSchema,
  changePasswordSchema,
  userStatusSchema,
} from '../validators/user.validator';

const router = express.Router();

router.use(authenticate);

router.get('/', requireRole('admin'), userController.list);
router.get(
  '/department/:deptId',
  requireRole('admin', 'manager'),
  userController.listByDepartment
);
router.post('/', requireRole('admin'), validate(createUserSchema), userController.create);
router.post(
  '/employee',
  requireRole('manager'),
  validate(createEmployeeSchema),
  userController.createEmployee
);
router.get('/:id', requireRole('admin', 'manager', 'employee'), userController.getById);
router.put(
  '/:id',
  requireRole('admin', 'manager', 'employee'),
  validate(updateUserSchema),
  userController.update
);
router.patch(
  '/:id/status',
  requireRole('admin'),
  validate(userStatusSchema),
  userController.updateStatus
);
router.delete('/:id', requireRole('admin'), userController.remove);
router.put(
  '/:id/password',
  requireRole('admin', 'manager', 'employee'),
  validate(changePasswordSchema),
  userController.changePassword
);

export default router;
