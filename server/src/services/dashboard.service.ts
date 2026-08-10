import mongoose from 'mongoose';
import Ticket, { OPEN_STATUSES } from '../models/Ticket';
import User, { type IUserDocument } from '../models/User';
import Department from '../models/Department';
import ApiError from '../utils/apiError';

const toObjectId = (id: unknown): mongoose.Types.ObjectId => {
  if (id instanceof mongoose.Types.ObjectId) return id;
  if (id && typeof id === 'object' && '_id' in id) {
    return new mongoose.Types.ObjectId(String((id as { _id: unknown })._id));
  }
  return new mongoose.Types.ObjectId(String(id));
};

const countByStatus = async (match: Record<string, unknown> = {}) => {
  const rows = await Ticket.aggregate<{ _id: string; count: number }>([
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const map: Record<string, number> = {};
  rows.forEach((r) => {
    map[r._id] = r.count;
  });
  return map;
};

export const adminDashboard = async () => {
  const [byStatus, totalTickets, openTickets, departments, users, overdue, recent, byDepartment] =
    await Promise.all([
      countByStatus(),
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: { $in: [...OPEN_STATUSES] } }),
      Department.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: true, role: { $ne: 'admin' } }),
      Ticket.countDocuments({
        status: { $in: [...OPEN_STATUSES] },
        expectedResolutionAt: { $lt: new Date() },
      }),
      Ticket.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('department', 'name')
        .populate('assignedTo', 'name')
        .lean(),
      Ticket.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } },
        {
          $lookup: {
            from: 'departments',
            localField: '_id',
            foreignField: '_id',
            as: 'department',
          },
        },
        { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            departmentId: '$_id',
            name: '$department.name',
            count: 1,
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

  return {
    totals: { tickets: totalTickets, open: openTickets, departments, users, overdue },
    byStatus,
    byDepartment,
    recent,
  };
};

export const managerDashboard = async (actor: IUserDocument) => {
  if (!actor.department) throw ApiError.badRequest('Manager has no department');
  const deptId = toObjectId(actor.department);
  const match = { department: deptId };

  const [byStatus, open, overdue, unassigned, employees, recent] = await Promise.all([
    countByStatus(match),
    Ticket.countDocuments({ ...match, status: { $in: [...OPEN_STATUSES] } }),
    Ticket.countDocuments({
      ...match,
      status: { $in: [...OPEN_STATUSES] },
      expectedResolutionAt: { $lt: new Date() },
    }),
    Ticket.countDocuments({ ...match, status: 'new', assignedTo: null }),
    User.countDocuments({ department: deptId, role: 'employee', isActive: true }),
    Ticket.find(match)
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('assignedTo', 'name')
      .lean(),
  ]);

  const workload = await Ticket.aggregate([
    {
      $match: {
        department: deptId,
        assignedTo: { $ne: null },
        status: { $in: [...OPEN_STATUSES] },
      },
    },
    { $group: { _id: '$assignedTo', openCount: { $sum: 1 } } },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'employee',
      },
    },
    { $unwind: '$employee' },
    { $project: { employeeId: '$_id', name: '$employee.name', openCount: 1 } },
    { $sort: { openCount: -1 } },
  ]);

  return {
    totals: { open, overdue, unassigned, employees },
    byStatus,
    workload,
    recent,
  };
};

export const employeeDashboard = async (actor: IUserDocument) => {
  const match = { assignedTo: actor._id };

  const [byStatus, open, overdue, resolved, recent] = await Promise.all([
    countByStatus(match),
    Ticket.countDocuments({ ...match, status: { $in: [...OPEN_STATUSES] } }),
    Ticket.countDocuments({
      ...match,
      status: { $in: [...OPEN_STATUSES] },
      expectedResolutionAt: { $lt: new Date() },
    }),
    Ticket.countDocuments({ ...match, status: 'resolved' }),
    Ticket.find(match)
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate('department', 'name')
      .lean(),
  ]);

  return {
    totals: { open, overdue, resolved },
    byStatus,
    recent,
  };
};
