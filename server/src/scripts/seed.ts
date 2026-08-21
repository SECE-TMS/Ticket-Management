import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import connectDB from '../config/db';
import User from '../models/User';
import Department from '../models/Department';
import Ticket from '../models/Ticket';
import ActivityLog from '../models/ActivityLog';
import Notification from '../models/Notification';
import Counter from '../models/Counter';
import logger from '../utils/logger';

interface DeptSeed {
  name: string;
  description: string;
  complaintTypes: string[];
  slaHours: number;
}

const DEPARTMENTS: DeptSeed[] = [
  {
    name: 'Plumbing',
    description: 'Water supply, drainage, and pipe maintenance',
    complaintTypes: ['Leakage', 'Blocked Drain', 'No Water', 'Broken Tap', 'Other'],
    slaHours: 24,
  },
  {
    name: 'Electrical',
    description: 'Power, lighting, and electrical fixtures',
    complaintTypes: ['Power Outage', 'Faulty Wiring', 'Light Fixture', 'Short Circuit', 'Other'],
    slaHours: 24,
  },
  {
    name: 'Gardening',
    description: 'Landscaping and grounds maintenance',
    complaintTypes: ['Overgrown Grass', 'Tree Trimming', 'Irrigation', 'Pest Plants', 'Other'],
    slaHours: 72,
  },
  {
    name: 'IT',
    description: 'Network, devices, and software support',
    complaintTypes: ['Network Down', 'Hardware Issue', 'Software Bug', 'Access Request', 'Other'],
    slaHours: 8,
  },
  {
    name: 'Housekeeping',
    description: 'Cleaning and sanitation services',
    complaintTypes: ['Cleaning Required', 'Trash Overflow', 'Restroom Issue', 'Spill', 'Other'],
    slaHours: 12,
  },
];

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
    email: 'admin@sece.ac.in',
    password: 'Admin@123',
    role: 'admin',
    phone: '9999999999',
  });
  logger.info(`Admin created: ${admin.email}`);

  for (const deptDef of DEPARTMENTS) {
    const dept = await Department.create({
      name: deptDef.name,
      description: deptDef.description,
      complaintTypes: deptDef.complaintTypes,
      slaHours: deptDef.slaHours,
      manager: null,
    });
    logger.info(`Department created: ${dept.name} (SLA: ${dept.slaHours}h)`);
  }

  logger.info('Seed completed successfully');
  logger.info('========== Initial Admin Credentials ==========');
  logger.info('Role       | Email                   | Password');
  logger.info('-----------|-------------------------|-------------');
  logger.info('Admin      | admin@sece.ac.in        | Admin@123');
  logger.info('================================================');
  logger.info(`Seeded ${DEPARTMENTS.length} active departments ready for manager assignment.`);

  process.exit(0);
};

seed().catch((err: unknown) => {
  logger.error('Seed failed', err);
  process.exit(1);
});
