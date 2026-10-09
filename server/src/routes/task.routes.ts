import express from 'express';
import * as taskController from '../controllers/task.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import validate from '../middlewares/validate.middleware';
import { upload } from '../middlewares/upload.middleware';
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  toggleChecklistItemSchema,
} from '../validators/task.validator';

const router = express.Router();

router.use(authenticate);

// List tasks (accessible by admin, manager, employee)
router.get('/', requireRole('admin', 'manager', 'employee'), taskController.list);

// Create task (accessible by admin, manager)
router.post(
  '/',
  requireRole('admin', 'manager'),
  validate(createTaskSchema),
  taskController.create
);

// Get task by ID
router.get('/:id', requireRole('admin', 'manager', 'employee'), taskController.getById);

// Update task details (admin, manager)
router.patch(
  '/:id',
  requireRole('admin', 'manager'),
  validate(updateTaskSchema),
  taskController.update
);

// Update task status with optional proof attachment (admin, manager, employee)
router.patch(
  '/:id/status',
  requireRole('admin', 'manager', 'employee'),
  upload.single('proof'),
  validate(updateTaskStatusSchema),
  taskController.updateStatus
);

// Toggle checklist item
router.patch(
  '/:id/checklist/:itemId',
  requireRole('admin', 'manager', 'employee'),
  validate(toggleChecklistItemSchema),
  taskController.toggleChecklist
);

// Delete task (admin only)
router.delete('/:id', requireRole('admin'), taskController.remove);

export default router;
