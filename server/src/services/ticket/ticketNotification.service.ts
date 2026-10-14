import Ticket, { type ITicket, type ITicketDocument } from '../../models/Ticket';
import User, { type IUserDocument } from '../../models/User';
import { sendEmail } from '../../config/email';
import { getSettings } from '../setting.service';
import type { ISetting } from '../../models/Setting';

export const notifyRequesterOnAction = async (
  ticket: ITicket,
  actionTitle: string,
  actionDetail: string,
  eventType?: keyof ISetting['notifyEvents']
) => {
  try {
    const settings = await getSettings();
    if (!settings.emailNotificationsEnabled) return;

    if (eventType && settings.notifyEvents && settings.notifyEvents[eventType] === false) {
      return;
    }

    if (!settings.notifyRequesterOnEveryAction && (!eventType || !settings.notifyEvents?.[eventType])) {
      return;
    }

    if (!ticket.requester || !ticket.requester.email) return;

    const deptName = (ticket.department as unknown as { name?: string })?.name || 'Support Department';
    const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
    const trackUrl = `${clientOrigin}/track-ticket?ticketCode=${encodeURIComponent(ticket.ticketCode)}&mobile=${encodeURIComponent(ticket.requester.mobile)}`;

    const subject = `[TMS Ticket #${ticket.ticketCode}] ${actionTitle}`;
    const html = `
      <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <div style="background-color: #1e3a8a; padding: 24px; text-align: center; color: white;">
          <h2 style="margin: 0; font-size: 22px; font-weight: bold; letter-spacing: -0.5px;">TMS Portal</h2>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #fde047; text-transform: uppercase; font-weight: bold; tracking: 1px;">${actionTitle}</p>
        </div>

        <div style="padding: 28px; background-color: #ffffff;">
          <p style="font-size: 15px; margin-top: 0; color: #334155;">Dear <strong>${ticket.requester.name}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.6; color: #475569;">
            ${actionDetail}
          </p>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: bold; width: 140px;">Ticket Reference:</td>
                <td style="padding: 6px 0; font-family: monospace; font-size: 16px; font-weight: bold; color: #1e3a8a;">${ticket.ticketCode}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Department:</td>
                <td style="padding: 6px 0; color: #1e293b; font-weight: 600;">${deptName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Complaint Type:</td>
                <td style="padding: 6px 0; color: #1e293b; font-weight: 600;">${ticket.complaintType}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Current Status:</td>
                <td style="padding: 6px 0;">
                  <span style="display: inline-block; background-color: #dbeafe; color: #1e40af; font-weight: bold; padding: 3px 10px; border-radius: 9999px; font-size: 11px; text-transform: uppercase;">
                    ${ticket.status.replace('_', ' ')}
                  </span>
                </td>
              </tr>
              ${ticket.expectedResolutionAt ? `
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Target Resolution:</td>
                <td style="padding: 6px 0; color: #047857; font-weight: bold;">${new Date(ticket.expectedResolutionAt).toLocaleString()}</td>
              </tr>
              ` : ''}
            </table>

            <div style="margin-top: 14px; pt: 12px; border-top: 1px border #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: bold; uppercase;">Description:</p>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #334155; font-style: italic;">"${ticket.description}"</p>
            </div>
          </div>

          <div style="text-align: center; margin: 28px 0 16px 0;">
            <a href="${trackUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 14px; padding: 12px 28px; border-radius: 10px; box-shadow: 0 2px 4px rgba(37,99,235,0.3);">
              Track Ticket Status Live →
            </a>
          </div>

          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-bottom: 0;">
            Sri Eshwar College of Engineering · Ticket Management System
          </p>
        </div>
      </div>
    `;

    await sendEmail({
      to: ticket.requester.email,
      subject,
      html,
      text: `${actionTitle}: Your ticket #${ticket.ticketCode} (${ticket.complaintType}) - Status: ${ticket.status}. Track online at: ${trackUrl}`,
    });
  } catch (err) {
    console.error('Error sending email to requester:', err);
  }
};

export const notifyStaffOnTicketCreated = async (
  ticket: ITicketDocument,
  department: any
) => {
  try {
    const settings = await getSettings();
    if (!settings.emailNotificationsEnabled) return;

    const clientOrigin = process.env.CLIENT_ORIGIN || process.env.CLIENT_URL || 'http://localhost:5173';
    const deptName = department?.name || 'Department';
    const deptId = department?._id || ticket.department;

    const admins = await User.find({ role: 'admin', isActive: true });
    const managers = await User.find({ role: 'manager', department: deptId, isActive: true });

    for (const admin of admins) {
      if (!admin.email) continue;
      const adminUrl = `${clientOrigin}/admin/tickets/${ticket._id}`;
      const subject = `[TMS Admin Alert] New Ticket #${ticket.ticketCode} - ${deptName} (${ticket.priority.toUpperCase()})`;
      const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.08);">
          <div style="background-color: #1e3a8a; padding: 22px; text-align: center; color: white;">
            <h2 style="margin: 0; font-size: 20px; font-weight: bold;">TMS Admin Notification</h2>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #93c5fd; font-weight: bold; text-transform: uppercase;">New Ticket Logged</p>
          </div>
          <div style="padding: 24px; background-color: #ffffff;">
            <p style="font-size: 14px; margin-top: 0; color: #334155;">Hello <strong>${admin.name}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.5; color: #475569;">
              A new ticket <strong>#${ticket.ticketCode}</strong> has been created in department <strong>${deptName}</strong>.
            </p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 18px 0;">
              <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 5px 0; color: #64748b; font-weight: bold; width: 140px;">Ticket ID:</td>
                  <td style="padding: 5px 0; font-family: monospace; font-size: 15px; font-weight: bold; color: #1e3a8a;">#${ticket.ticketCode}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #64748b; font-weight: bold;">Department:</td>
                  <td style="padding: 5px 0; color: #1e293b; font-weight: 600;">${deptName}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #64748b; font-weight: bold;">Complaint Type:</td>
                  <td style="padding: 5px 0; color: #1e293b; font-weight: 600;">${ticket.complaintType}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #64748b; font-weight: bold;">Priority:</td>
                  <td style="padding: 5px 0;">
                    <span style="font-weight: bold; color: ${ticket.priority === 'urgent' ? '#dc2626' : ticket.priority === 'high' ? '#ea580c' : '#2563eb'}; text-transform: uppercase;">
                      ${ticket.priority}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #64748b; font-weight: bold;">Requester:</td>
                  <td style="padding: 5px 0; color: #1e293b;">${ticket.requester?.name || '—'} (${ticket.requester?.mobile || '—'})</td>
                </tr>
              </table>
              <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: bold;">Description:</p>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: #334155; font-style: italic;">"${ticket.description}"</p>
              </div>
            </div>
            <div style="text-align: center; margin: 22px 0 10px 0;">
              <a href="${adminUrl}" target="_blank" style="display: inline-block; background-color: #1e3a8a; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 13px; padding: 11px 26px; border-radius: 8px;">
                View Ticket in Admin Portal →
              </a>
            </div>
          </div>
        </div>
      `;

      await sendEmail({
        to: admin.email,
        subject,
        html,
        text: `New Ticket #${ticket.ticketCode} logged in ${deptName} (${ticket.priority}). View online at: ${adminUrl}`,
      });
    }

    for (const manager of managers) {
      if (!manager.email) continue;
      const managerUrl = `${clientOrigin}/manager/tickets/${ticket._id}`;
      const subject = `[TMS Action Required] New Ticket #${ticket.ticketCode} - ${deptName} (${ticket.priority.toUpperCase()})`;
      const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.08);">
          <div style="background-color: #0369a1; padding: 22px; text-align: center; color: white;">
            <h2 style="margin: 0; font-size: 20px; font-weight: bold;">TMS Manager Alert</h2>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #fed7aa; font-weight: bold; text-transform: uppercase;">Ticket Awaiting Assignment</p>
          </div>
          <div style="padding: 24px; background-color: #ffffff;">
            <p style="font-size: 14px; margin-top: 0; color: #334155;">Hello <strong>${manager.name}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.5; color: #475569;">
              A new ticket has been assigned to your department (<strong>${deptName}</strong>). Please assign an employee to handle it.
            </p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 18px 0;">
              <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 5px 0; color: #64748b; font-weight: bold; width: 140px;">Ticket ID:</td>
                  <td style="padding: 5px 0; font-family: monospace; font-size: 15px; font-weight: bold; color: #0369a1;">#${ticket.ticketCode}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #64748b; font-weight: bold;">Department:</td>
                  <td style="padding: 5px 0; color: #1e293b; font-weight: 600;">${deptName}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #64748b; font-weight: bold;">Complaint Type:</td>
                  <td style="padding: 5px 0; color: #1e293b; font-weight: 600;">${ticket.complaintType}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #64748b; font-weight: bold;">Priority:</td>
                  <td style="padding: 5px 0;">
                    <span style="font-weight: bold; color: ${ticket.priority === 'urgent' ? '#dc2626' : ticket.priority === 'high' ? '#ea580c' : '#0369a1'}; text-transform: uppercase;">
                      ${ticket.priority}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #64748b; font-weight: bold;">Requester:</td>
                  <td style="padding: 5px 0; color: #1e293b;">${ticket.requester?.name || '—'} (${ticket.requester?.mobile || '—'})</td>
                </tr>
              </table>
              <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: bold;">Description:</p>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: #334155; font-style: italic;">"${ticket.description}"</p>
              </div>
            </div>
            <div style="text-align: center; margin: 22px 0 10px 0;">
              <a href="${managerUrl}" target="_blank" style="display: inline-block; background-color: #0369a1; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 13px; padding: 11px 26px; border-radius: 8px;">
                Assign Employee Now →
              </a>
            </div>
          </div>
        </div>
      `;

      await sendEmail({
        to: manager.email,
        subject,
        html,
        text: `New Ticket #${ticket.ticketCode} awaiting assignment in ${deptName} (${ticket.priority}). View online at: ${managerUrl}`,
      });
    }
  } catch (err) {
    console.error('Error sending staff notifications on ticket creation:', err);
  }
};

export const notifyEmployeeOnAssignment = async (
  ticket: ITicketDocument,
  employee: IUserDocument,
  assignedBy?: IUserDocument | null
) => {
  try {
    const settings = await getSettings();
    if (!settings.emailNotificationsEnabled) return;
    if (!employee || !employee.email) return;

    const clientOrigin = process.env.CLIENT_ORIGIN || process.env.CLIENT_URL || 'http://localhost:5173';
    const employeeUrl = `${clientOrigin}/employee/tickets/${ticket._id}`;
    const assignerName = assignedBy?.name || 'Department Manager';
    const deptName = (ticket.department as unknown as { name?: string })?.name || 'Department';

    const subject = `[TMS Task Assignment] Ticket #${ticket.ticketCode} Assigned to You`;
    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.08);">
        <div style="background-color: #0f766e; padding: 22px; text-align: center; color: white;">
          <h2 style="margin: 0; font-size: 20px; font-weight: bold;">TMS Task Assignment</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #fde047; font-weight: bold; text-transform: uppercase;">Ticket Assigned to You</p>
        </div>
        <div style="padding: 24px; background-color: #ffffff;">
          <p style="font-size: 14px; margin-top: 0; color: #334155;">Hello <strong>${employee.name}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.5; color: #475569;">
            You have been assigned ticket <strong>#${ticket.ticketCode}</strong> by <strong>${assignerName}</strong>.
          </p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 18px 0;">
            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
              <tr>
                <td style="padding: 5px 0; color: #64748b; font-weight: bold; width: 140px;">Ticket ID:</td>
                <td style="padding: 5px 0; font-family: monospace; font-size: 15px; font-weight: bold; color: #0f766e;">#${ticket.ticketCode}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #64748b; font-weight: bold;">Department:</td>
                <td style="padding: 5px 0; color: #1e293b; font-weight: 600;">${deptName}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #64748b; font-weight: bold;">Complaint Type:</td>
                <td style="padding: 5px 0; color: #1e293b; font-weight: 600;">${ticket.complaintType}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #64748b; font-weight: bold;">Priority:</td>
                <td style="padding: 5px 0;">
                  <span style="font-weight: bold; color: ${ticket.priority === 'urgent' ? '#dc2626' : ticket.priority === 'high' ? '#ea580c' : '#0f766e'}; text-transform: uppercase;">
                    ${ticket.priority}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #64748b; font-weight: bold;">Requester:</td>
                <td style="padding: 5px 0; color: #1e293b;">${ticket.requester?.name || '—'} (${ticket.requester?.mobile || '—'})</td>
              </tr>
              ${ticket.expectedResolutionAt ? `
              <tr>
                <td style="padding: 5px 0; color: #64748b; font-weight: bold;">Deadline:</td>
                <td style="padding: 5px 0; color: #047857; font-weight: bold;">${new Date(ticket.expectedResolutionAt).toLocaleString()}</td>
              </tr>
              ` : ''}
            </table>
            <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: bold;">Description:</p>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #334155; font-style: italic;">"${ticket.description}"</p>
            </div>
          </div>
          <div style="text-align: center; margin: 22px 0 10px 0;">
            <a href="${employeeUrl}" target="_blank" style="display: inline-block; background-color: #0f766e; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 13px; padding: 11px 26px; border-radius: 8px;">
              View & Update Task →
            </a>
          </div>
        </div>
      </div>
    `;

    await sendEmail({
      to: employee.email,
      subject,
      html,
      text: `You have been assigned ticket #${ticket.ticketCode} (${deptName} - ${ticket.complaintType}). View online at: ${employeeUrl}`,
    });
  } catch (err) {
    console.error('Error sending employee assignment email:', err);
  }
};
