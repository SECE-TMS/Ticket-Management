import { type Types } from 'mongoose';
import { type ITask } from '../../models/Task';
import User from '../../models/User';
import Department from '../../models/Department';
import Notification from '../../models/Notification';
import logger from '../../utils/logger';
import { sendEmail } from '../../config/email';

/**
 * Dispatches multi-channel notifications (In-App, Email, SMS/WhatsApp) when a task is assigned or updated.
 */
export const notifyTaskAssignment = async (
  task: ITask & { _id: Types.ObjectId },
  actorName: string,
  isUpdate = false
) => {
  try {
    const employee = await User.findById(task.assignedTo).lean();
    if (!employee) return;

    const dept = await Department.findById(task.department).lean();
    const deptName = dept?.name || 'Department';
    const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
    const taskUrl = `${clientOrigin}/employee/tasks/${task._id}`;
    const actionLabel = isUpdate ? 'Task Updated' : 'New Task Assigned';

    // 1. In-App Notification
    if (task.notificationPreferences?.inApp !== false) {
      await Notification.create({
        recipient: employee._id,
        task: task._id,
        type: isUpdate ? 'task_updated' : 'task_assigned',
        message: `${actionLabel}: "${task.title}" (Priority: ${task.priority.toUpperCase()}) assigned by ${actorName}`,
        channel: 'in_app',
      });
      logger.info(`[task-notify-inapp] Dispatched to user ${employee.email} for task ${task.taskCode}`);
    }

    // 2. Email Notification
    if (task.notificationPreferences?.email !== false && employee.email) {
      const priorityColors: Record<string, string> = {
        urgent: '#dc2626',
        high: '#ea580c',
        medium: '#2563eb',
        low: '#16a34a',
      };
      const pColor = priorityColors[task.priority] || '#2563eb';
      const formattedDueDate = task.dueDate
        ? new Date(task.dueDate).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Not specified';

      const checklistHtml = task.checklist?.length
        ? `<div style="margin-top: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px;">
            <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: bold; color: #475569; text-transform: uppercase;">Checklist Subtasks (${task.checklist.length}):</p>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #334155;">
              ${task.checklist.map((c) => `<li style="margin-bottom: 4px;">${c.title}</li>`).join('')}
            </ul>
           </div>`
        : '';

      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <div style="background-color: #1e3a8a; padding: 24px; text-align: center; color: white;">
            <h2 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: -0.5px;">TMS Facility Portal</h2>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #fde047; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">📋 ${actionLabel}</p>
          </div>

          <div style="padding: 28px; background-color: #ffffff;">
            <p style="font-size: 15px; margin-top: 0; color: #334155;">Dear <strong>${employee.name}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #475569;">
              You have been assigned a specific work task by <strong>${actorName}</strong> for the <strong>${deptName}</strong> department.
            </p>

            <div style="background-color: #f1f5f9; border-left: 4px solid ${pColor}; padding: 16px; border-radius: 0 12px 12px 0; margin: 20px 0;">
              <p style="margin: 0; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b;">Task ID &amp; Title</p>
              <h3 style="margin: 4px 0 8px 0; font-size: 16px; color: #0f172a;">${task.taskCode}: ${task.title}</h3>
              
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px;">
                <tr>
                  <td style="padding: 4px 0; color: #64748b; width: 35%;">Priority:</td>
                  <td style="padding: 4px 0; font-weight: bold; color: ${pColor}; text-transform: uppercase;">${task.priority}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #64748b;">Due Deadline:</td>
                  <td style="padding: 4px 0; font-weight: bold; color: #1e293b;">${formattedDueDate}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #64748b;">Assigned By:</td>
                  <td style="padding: 4px 0; font-weight: bold; color: #1e293b;">${actorName}</td>
                </tr>
              </table>
            </div>

            <div style="margin-bottom: 20px;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase;">Instructions / Description:</p>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1e293b; background-color: #fafafa; border: 1px solid #f0f0f0; border-radius: 8px; padding: 12px; white-space: pre-line;">${task.description}</p>
            </div>

            ${checklistHtml}

            <div style="text-align: center; margin: 30px 0 10px 0;">
              <a href="${taskUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 10px; display: inline-block; box-shadow: 0 2px 4px rgba(37,99,235,0.3);">
                View Task &amp; Start Work →
              </a>
            </div>
          </div>

          <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
            This is an automated operational notification from TMS Portal.
          </div>
        </div>
      `;

      try {
        await sendEmail({
          to: employee.email,
          subject: `[TMS Task ${task.taskCode}] ${actionLabel}: ${task.title}`,
          html,
        });
        logger.info(`[task-notify-email] Sent assignment email to ${employee.email}`);
      } catch (e: any) {
        logger.warn(`[task-notify-email-error] ${e?.message}`);
      }
    }

    // 3. SMS Alert (if phone number is available)
    if (task.notificationPreferences?.sms !== false && employee.phone) {
      const sanitizedPhone = employee.phone.trim().replace(/\D/g, '').slice(-10);
      if (sanitizedPhone.length === 10) {
        const TWOFACTOR_API_KEY = process.env.TWOFACTOR_API_KEY || '40a61f6f-953e-11f1-9cb1-0200cd936042';
        const smsMessage = encodeURIComponent(
          `[TMS Task ${task.taskCode}] New task assigned: ${task.title.slice(0, 30)}. Priority: ${task.priority.toUpperCase()}. View at: ${taskUrl}`
        );
        try {
          const url = `https://2factor.in/API/V1/${TWOFACTOR_API_KEY}/SMS/${sanitizedPhone}/${smsMessage}`;
          await fetch(url);
          logger.info(`[task-notify-sms] Dispatched SMS to ${sanitizedPhone} for task ${task.taskCode}`);
        } catch (e: any) {
          logger.warn(`[task-notify-sms-error] Failed to send SMS: ${e?.message}`);
        }
      }
    }
  } catch (err: any) {
    logger.error(`[task-notification-error] ${err?.message}`);
  }
};
