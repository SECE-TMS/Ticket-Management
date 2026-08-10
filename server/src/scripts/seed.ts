import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import connectDB from '../config/db';
import User, { type IUserDocument } from '../models/User';
import Department, { type IDepartmentDocument } from '../models/Department';
import Ticket from '../models/Ticket';
import ActivityLog from '../models/ActivityLog';
import Notification from '../models/Notification';
import Counter from '../models/Counter';
import generateTicketCode from '../utils/generateTicketCode';
import logger from '../utils/logger';
import type { TicketPriority, TicketStatus } from '../models/Ticket';

interface DeptSeed {
  name: string;
  description: string;
  complaintTypes: string[];
  slaHours: number;
  manager: { name: string; email: string; phone: string };
  employees: Array<{ name: string; email: string; phone: string }>;
}

interface TicketSeedSpec {
  deptName: string;
  status: TicketStatus;
  priority: TicketPriority;
  complaintType: string;
  description: string;
  requester: { name: string; mobile: string; email?: string };
  employeeIndex?: 0 | 1;
  resolutionRemarks?: string;
}

const DEPARTMENTS: DeptSeed[] = [
  {
    name: 'Plumbing',
    description: 'Water supply, drainage, and pipe maintenance',
    complaintTypes: ['Leakage', 'Blocked Drain', 'No Water', 'Broken Tap', 'Other'],
    slaHours: 24,
    manager: {
      name: 'Rajesh Kumar',
      email: 'manager.plumbing@tms.local',
      phone: '9888888801',
    },
    employees: [
      { name: 'John Plumber', email: 'emp1.plumbing@tms.local', phone: '9777777701' },
      { name: 'Sara Technician', email: 'emp2.plumbing@tms.local', phone: '9777777702' },
    ],
  },
  {
    name: 'Electrical',
    description: 'Power, lighting, and electrical fixtures',
    complaintTypes: ['Power Outage', 'Faulty Wiring', 'Light Fixture', 'Short Circuit', 'Other'],
    slaHours: 24,
    manager: {
      name: 'Priya Sharma',
      email: 'manager.electrical@tms.local',
      phone: '9888888802',
    },
    employees: [
      { name: 'Amit Electrician', email: 'emp1.electrical@tms.local', phone: '9777777703' },
      { name: 'Neha Sparks', email: 'emp2.electrical@tms.local', phone: '9777777704' },
    ],
  },
  {
    name: 'Gardening',
    description: 'Landscaping and grounds maintenance',
    complaintTypes: ['Overgrown Grass', 'Tree Trimming', 'Irrigation', 'Pest Plants', 'Other'],
    slaHours: 72,
    manager: {
      name: 'Vikram Green',
      email: 'manager.gardening@tms.local',
      phone: '9888888803',
    },
    employees: [
      { name: 'Ravi Gardner', email: 'emp1.gardening@tms.local', phone: '9777777705' },
      { name: 'Meena Leaves', email: 'emp2.gardening@tms.local', phone: '9777777706' },
    ],
  },
  {
    name: 'IT',
    description: 'Network, devices, and software support',
    complaintTypes: ['Network Down', 'Hardware Issue', 'Software Bug', 'Access Request', 'Other'],
    slaHours: 8,
    manager: {
      name: 'Ananya Patel',
      email: 'manager.it@tms.local',
      phone: '9888888804',
    },
    employees: [
      { name: 'Karan Devops', email: 'emp1.it@tms.local', phone: '9777777707' },
      { name: 'Sneha Support', email: 'emp2.it@tms.local', phone: '9777777708' },
    ],
  },
  {
    name: 'Housekeeping',
    description: 'Cleaning and sanitation services',
    complaintTypes: ['Cleaning Required', 'Trash Overflow', 'Restroom Issue', 'Spill', 'Other'],
    slaHours: 12,
    manager: {
      name: 'Sunita Clean',
      email: 'manager.housekeeping@tms.local',
      phone: '9888888805',
    },
    employees: [
      { name: 'Deepak Sweeper', email: 'emp1.housekeeping@tms.local', phone: '9777777709' },
      { name: 'Lata Sanitation', email: 'emp2.housekeeping@tms.local', phone: '9777777710' },
    ],
  },
];

const TICKET_SPECS: TicketSeedSpec[] = [
  // Plumbing
  {
    deptName: 'Plumbing',
    status: 'new',
    priority: 'high',
    complaintType: 'Leakage',
    description: 'Kitchen sink pipe is leaking continuously in Block A unit 12.',
    requester: { name: 'Alice Resident', mobile: '9000000001', email: 'alice@example.com' },
  },
  {
    deptName: 'Plumbing',
    status: 'assigned',
    priority: 'medium',
    complaintType: 'Blocked Drain',
    description: 'Bathroom drain is clogged and water is backing up.',
    requester: { name: 'Bob Resident', mobile: '9000000002' },
    employeeIndex: 0,
  },
  {
    deptName: 'Plumbing',
    status: 'in_progress',
    priority: 'urgent',
    complaintType: 'No Water',
    description: 'No water supply in unit 4B since morning.',
    requester: { name: 'Carol Resident', mobile: '9000000003' },
    employeeIndex: 1,
  },
  // Electrical
  {
    deptName: 'Electrical',
    status: 'new',
    priority: 'urgent',
    complaintType: 'Power Outage',
    description: 'Complete power outage on floor 3 of the north wing.',
    requester: { name: 'David Tenant', mobile: '9000000004', email: 'david@example.com' },
  },
  {
    deptName: 'Electrical',
    status: 'accepted',
    priority: 'high',
    complaintType: 'Faulty Wiring',
    description: 'Sparks noticed near the hallway socket near lift lobby.',
    requester: { name: 'Eva Tenant', mobile: '9000000005' },
    employeeIndex: 0,
  },
  {
    deptName: 'Electrical',
    status: 'resolved',
    priority: 'medium',
    complaintType: 'Light Fixture',
    description: 'Corridor lights flickering intermittently after dusk.',
    requester: { name: 'Frank Tenant', mobile: '9000000006' },
    employeeIndex: 1,
    resolutionRemarks: 'Replaced ballast and verified all corridor fixtures.',
  },
  // Gardening
  {
    deptName: 'Gardening',
    status: 'assigned',
    priority: 'low',
    complaintType: 'Overgrown Grass',
    description: 'Lawn near the east gate needs mowing before weekend event.',
    requester: { name: 'Grace Owner', mobile: '9000000007' },
    employeeIndex: 0,
  },
  {
    deptName: 'Gardening',
    status: 'closed',
    priority: 'medium',
    complaintType: 'Tree Trimming',
    description: 'Overhanging branches blocking CCTV view near parking.',
    requester: { name: 'Henry Owner', mobile: '9000000008', email: 'henry@example.com' },
    employeeIndex: 1,
    resolutionRemarks: 'Trimmed branches and cleared debris from parking bay.',
  },
  {
    deptName: 'Gardening',
    status: 'reopened',
    priority: 'high',
    complaintType: 'Irrigation',
    description: 'Sprinkler system not covering west lawn properly.',
    requester: { name: 'Ivy Owner', mobile: '9000000009' },
    employeeIndex: 0,
    resolutionRemarks: 'Adjusted heads; issue reported again after dry spell.',
  },
  // IT
  {
    deptName: 'IT',
    status: 'new',
    priority: 'high',
    complaintType: 'Network Down',
    description: 'Office Wi-Fi offline for the admin block since 9 AM.',
    requester: { name: 'Jack Staff', mobile: '9000000010', email: 'jack@example.com' },
  },
  {
    deptName: 'IT',
    status: 'in_progress',
    priority: 'urgent',
    complaintType: 'Hardware Issue',
    description: 'Reception desktop fails to boot after power surge.',
    requester: { name: 'Karen Staff', mobile: '9000000011' },
    employeeIndex: 0,
  },
  {
    deptName: 'IT',
    status: 'resolved',
    priority: 'medium',
    complaintType: 'Access Request',
    description: 'Need VPN access for remote finance team member.',
    requester: { name: 'Leo Staff', mobile: '9000000012' },
    employeeIndex: 1,
    resolutionRemarks: 'Provisioned VPN account and verified login.',
  },
  // Housekeeping
  {
    deptName: 'Housekeeping',
    status: 'accepted',
    priority: 'medium',
    complaintType: 'Cleaning Required',
    description: 'Conference room needs deep clean before board meeting.',
    requester: { name: 'Maya Guest', mobile: '9000000013' },
    employeeIndex: 0,
  },
  {
    deptName: 'Housekeeping',
    status: 'closed',
    priority: 'low',
    complaintType: 'Trash Overflow',
    description: 'Dumpster near Block C is overflowing after weekend.',
    requester: { name: 'Nick Guest', mobile: '9000000014', email: 'nick@example.com' },
    employeeIndex: 1,
    resolutionRemarks: 'Cleared dumpster and scheduled extra pickup.',
  },
  {
    deptName: 'Housekeeping',
    status: 'assigned',
    priority: 'urgent',
    complaintType: 'Spill',
    description: 'Large liquid spill in lobby creating slip hazard.',
    requester: { name: 'Olivia Guest', mobile: '9000000015' },
    employeeIndex: 0,
  },
];

interface DeptTeam {
  department: IDepartmentDocument;
  manager: IUserDocument;
  employees: IUserDocument[];
  slaHours: number;
}

const hoursFromNow = (hours: number) => new Date(Date.now() + hours * 60 * 60 * 1000);

const seed = async (): Promise<void> => {
  await connectDB();

  logger.info('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Department.deleteMany({}),
    Ticket.deleteMany({}),
    ActivityLog.deleteMany({}),
    Notification.deleteMany({}),
    Counter.deleteMany({}),
  ]);

  const admin = await User.create({
    name: 'System Admin',
    email: 'admin@tms.local',
    password: 'Admin@123',
    role: 'admin',
    phone: '9999999999',
  });
  logger.info(`Admin created: ${admin.email}`);

  const teams = new Map<string, DeptTeam>();

  for (const deptDef of DEPARTMENTS) {
    const department = await Department.create({
      name: deptDef.name,
      description: deptDef.description,
      complaintTypes: deptDef.complaintTypes,
      slaHours: deptDef.slaHours,
    });

    const manager = await User.create({
      name: deptDef.manager.name,
      email: deptDef.manager.email,
      password: 'Manager@123',
      role: 'manager',
      department: department._id,
      phone: deptDef.manager.phone,
      createdBy: admin._id,
    });

    department.manager = manager._id;
    await department.save();

    const employees: IUserDocument[] = [];
    for (const emp of deptDef.employees) {
      const employee = await User.create({
        name: emp.name,
        email: emp.email,
        password: 'Employee@123',
        role: 'employee',
        department: department._id,
        phone: emp.phone,
        createdBy: manager._id,
      });
      employees.push(employee);
    }

    teams.set(deptDef.name, {
      department,
      manager,
      employees,
      slaHours: deptDef.slaHours,
    });

    logger.info(
      `${deptDef.name}: manager ${manager.email}, employees ${employees.map((e) => e.email).join(', ')}`
    );
  }

  logger.info('Creating sample tickets across all departments...');

  for (const spec of TICKET_SPECS) {
    const team = teams.get(spec.deptName);
    if (!team) throw new Error(`Missing team for ${spec.deptName}`);

    const assignee =
      spec.employeeIndex !== undefined ? team.employees[spec.employeeIndex] : undefined;
    const ticketCode = await generateTicketCode();
    const expectedResolutionAt = hoursFromNow(team.slaHours);

    const ticketData: Record<string, unknown> = {
      ticketCode,
      requester: {
        name: spec.requester.name,
        mobile: spec.requester.mobile,
        email: spec.requester.email || '',
      },
      department: team.department._id,
      complaintType: spec.complaintType,
      description: spec.description,
      priority: spec.priority,
      status: spec.status,
      expectedResolutionAt,
    };

    if (assignee && spec.status !== 'new') {
      ticketData.assignedTo = assignee._id;
      ticketData.assignedBy = team.manager._id;
    }

    if (spec.status === 'resolved' || spec.status === 'closed' || spec.status === 'reopened') {
      ticketData.resolution = {
        remarks: spec.resolutionRemarks || 'Issue fixed and verified on site.',
        attachment: null,
        resolvedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      };
    }

    if (spec.status === 'closed') {
      ticketData.closedBy = team.manager._id;
      ticketData.closedAt = new Date(Date.now() - 60 * 60 * 1000);
    }

    if (spec.status === 'reopened') {
      ticketData.reopenCount = 1;
      ticketData.closedBy = null;
      ticketData.closedAt = null;
      ticketData.resolution = { remarks: '', attachment: null, resolvedAt: null };
    }

    const ticket = await Ticket.create(ticketData);

    await ActivityLog.create({
      ticket: ticket._id,
      actor: null,
      action: 'created',
      toStatus: 'new',
      message: `Ticket ${ticketCode} created`,
    });

    await Notification.create({
      recipient: team.manager._id,
      ticket: ticket._id,
      type: 'ticket_created',
      message: `New ticket ${ticketCode} in ${team.department.name}`,
    });

    if (assignee && spec.status !== 'new') {
      await ActivityLog.create({
        ticket: ticket._id,
        actor: team.manager._id,
        action: 'assigned',
        fromStatus: 'new',
        toStatus: 'assigned',
        message: `Assigned to ${assignee.name}`,
      });

      await Notification.create({
        recipient: assignee._id,
        ticket: ticket._id,
        type: 'ticket_assigned',
        message: `Ticket ${ticketCode} assigned to you`,
      });
    }

    if (spec.status === 'accepted') {
      await ActivityLog.create({
        ticket: ticket._id,
        actor: assignee!._id,
        action: 'status_changed',
        fromStatus: 'assigned',
        toStatus: 'accepted',
        message: 'Ticket accepted by assignee',
      });
    }

    if (spec.status === 'in_progress') {
      await ActivityLog.create({
        ticket: ticket._id,
        actor: assignee!._id,
        action: 'status_changed',
        fromStatus: 'accepted',
        toStatus: 'in_progress',
        message: 'Work started',
      });
    }

    if (spec.status === 'resolved' || spec.status === 'closed') {
      await ActivityLog.create({
        ticket: ticket._id,
        actor: assignee!._id,
        action: 'status_changed',
        fromStatus: 'in_progress',
        toStatus: 'resolved',
        message: spec.resolutionRemarks || 'Issue resolved',
      });

      await Notification.create({
        recipient: team.manager._id,
        ticket: ticket._id,
        type: 'ticket_resolved',
        message: `Ticket ${ticketCode} resolved`,
      });
    }

    if (spec.status === 'closed') {
      await ActivityLog.create({
        ticket: ticket._id,
        actor: team.manager._id,
        action: 'closed',
        fromStatus: 'resolved',
        toStatus: 'closed',
        message: 'Ticket closed by manager',
      });
    }

    if (spec.status === 'reopened') {
      await ActivityLog.create({
        ticket: ticket._id,
        actor: assignee!._id,
        action: 'status_changed',
        fromStatus: 'in_progress',
        toStatus: 'resolved',
        message: spec.resolutionRemarks || 'Previously resolved',
      });
      await ActivityLog.create({
        ticket: ticket._id,
        actor: team.manager._id,
        action: 'reopened',
        fromStatus: 'resolved',
        toStatus: 'reopened',
        message: 'Ticket reopened after follow-up complaint',
      });
    }
  }

  logger.info(`Created ${TICKET_SPECS.length} sample tickets`);
  logger.info('Seed completed successfully');
  logger.info('========== Login credentials ==========');
  logger.info('Role       | Email                              | Password');
  logger.info('-----------|------------------------------------|-------------');
  logger.info('Admin      | admin@tms.local                    | Admin@123');

  for (const deptDef of DEPARTMENTS) {
    logger.info(
      `Manager    | ${deptDef.manager.email.padEnd(34)} | Manager@123`
    );
    for (const emp of deptDef.employees) {
      logger.info(`Employee   | ${emp.email.padEnd(34)} | Employee@123`);
    }
  }
  logger.info('=======================================');

  process.exit(0);
};

seed().catch((err: unknown) => {
  logger.error('Seed failed', err);
  process.exit(1);
});
