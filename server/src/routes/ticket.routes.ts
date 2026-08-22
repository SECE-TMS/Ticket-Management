import express from 'express';
import * as ticketController from '../controllers/ticket.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { singleAttachment } from '../middlewares/upload.middleware';
import validate from '../middlewares/validate.middleware';
import {
  createTicketSchema,
  trackTicketSchema,
  assignTicketSchema,
  reassignTicketSchema,
  statusUpdateSchema,
  resolveTicketSchema,
  commentSchema,
  listTicketsQuerySchema,
} from '../validators/ticket.validator';

const router = express.Router();

router.post(
  '/',
  singleAttachment('attachment'),
  validate(createTicketSchema),
  ticketController.create
);
router.get('/track', validate(trackTicketSchema, 'query'), ticketController.track);
router.post('/feedback', ticketController.submitFeedback);

router.get(
  '/admin/feedback',
  authenticate,
  requireRole('admin'),
  ticketController.getAdminFeedbackList
);

router.get(
  '/admin/feedback/department-analytics',
  authenticate,
  requireRole('admin'),
  ticketController.getDepartmentFeedbackAnalytics
);

router.get(
  '/admin/feedback/category-analytics',
  authenticate,
  requireRole('admin'),
  ticketController.getCategoryFeedbackAnalytics
);

router.get(
  '/admin/feedback/timewise-analytics',
  authenticate,
  requireRole('admin'),
  ticketController.getTimeWiseFeedbackAnalytics
);

router.get(
  '/export',
  authenticate,
  requireRole('admin', 'manager'),
  ticketController.exportCsv
);

router.get(
  '/export-excel',
  authenticate,
  requireRole('admin', 'manager'),
  ticketController.exportExcel
);

router.get(
  '/',
  authenticate,
  requireRole('admin', 'manager', 'employee'),
  validate(listTicketsQuerySchema, 'query'),
  ticketController.list
);

router.get(
  '/:id',
  authenticate,
  requireRole('admin', 'manager', 'employee'),
  ticketController.getById
);

router.patch(
  '/:id/assign',
  authenticate,
  requireRole('admin', 'manager'),
  validate(assignTicketSchema),
  ticketController.assign
);

router.patch(
  '/:id/reassign',
  authenticate,
  requireRole('admin', 'manager'),
  validate(reassignTicketSchema),
  ticketController.reassign
);

router.patch(
  '/:id/status',
  authenticate,
  requireRole('admin', 'manager', 'employee'),
  validate(statusUpdateSchema),
  ticketController.updateStatus
);

router.post(
  '/:id/resolve',
  authenticate,
  requireRole('admin', 'manager', 'employee'),
  singleAttachment('attachment'),
  validate(resolveTicketSchema),
  ticketController.resolve
);

router.patch(
  '/:id/close',
  authenticate,
  requireRole('admin', 'manager'),
  ticketController.close
);

router.patch(
  '/:id/reopen',
  authenticate,
  requireRole('admin', 'manager'),
  ticketController.reopen
);

router.post(
  '/:id/comments',
  authenticate,
  requireRole('admin', 'manager', 'employee'),
  validate(commentSchema),
  ticketController.comment
);

export default router;
