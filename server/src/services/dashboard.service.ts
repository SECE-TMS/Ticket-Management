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

export const adminDashboard = async (query: Record<string, unknown> = {}) => {
  const match: Record<string, unknown> = {};

  if (query.department) {
    match.department = toObjectId(query.department);
  }

  const now = new Date();
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (query.startDate && query.endDate) {
    startDate = new Date(String(query.startDate));
    endDate = new Date(String(query.endDate));
    endDate.setHours(23, 59, 59, 999);
  } else if (query.timeRange) {
    const tr = String(query.timeRange);
    if (tr === '7d') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 7);
    } else if (tr === '30d') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 30);
    } else if (tr === '90d') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 90);
    } else if (tr === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    }
  }

  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) (match.createdAt as Record<string, unknown>).$gte = startDate;
    if (endDate) (match.createdAt as Record<string, unknown>).$lte = endDate;
  }

  const [
    byStatus,
    totalTickets,
    openTickets,
    resolvedTickets,
    departmentsCount,
    usersCount,
    overdueCount,
    recent,
    byDepartment,
    byPriorityRows,
    monthlyTrendRaw,
    deptPerformanceRaw,
    feedbackMonthlyRaw,
  ] = await Promise.all([
    countByStatus(match),
    Ticket.countDocuments(match),
    Ticket.countDocuments({ ...match, status: { $in: [...OPEN_STATUSES] } }),
    Ticket.countDocuments({ ...match, status: { $in: ['resolved', 'closed'] } }),
    Department.countDocuments({ isActive: true }),
    User.countDocuments({ isActive: true, role: { $ne: 'admin' } }),
    Ticket.countDocuments({
      ...match,
      status: { $in: [...OPEN_STATUSES] },
      expectedResolutionAt: { $lt: new Date() },
    }),
    Ticket.find(match)
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('department', 'name')
      .populate('assignedTo', 'name')
      .populate('requester', 'name mobile')
      .lean(),
    Ticket.aggregate([
      { $match: match },
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
    Ticket.aggregate([
      { $match: match },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]),
    Ticket.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          created: { $sum: 1 },
          resolved: {
            $sum: {
              $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 1, 0],
            },
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Ticket.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$department',
          total: { $sum: 1 },
          open: { $sum: { $cond: [{ $in: ['$status', [...OPEN_STATUSES]] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 1, 0] } },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $in: ['$status', [...OPEN_STATUSES]] },
                    { $lt: ['$expectedResolutionAt', new Date()] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          totalFeedback: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$feedback', null] },
                    { $ne: ['$feedback.rating', null] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          totalRatingSum: {
            $sum: { $ifNull: ['$feedback.rating', 0] },
          },
          satisfiedCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$feedback', null] },
                    { $gte: ['$feedback.rating', 4] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          star5Count: { $sum: { $cond: [{ $eq: ['$feedback.rating', 5] }, 1, 0] } },
          star4Count: { $sum: { $cond: [{ $eq: ['$feedback.rating', 4] }, 1, 0] } },
          star3Count: { $sum: { $cond: [{ $eq: ['$feedback.rating', 3] }, 1, 0] } },
          star2Count: { $sum: { $cond: [{ $eq: ['$feedback.rating', 2] }, 1, 0] } },
          star1Count: { $sum: { $cond: [{ $eq: ['$feedback.rating', 1] }, 1, 0] } },
        },
      },
      {
        $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: '_id',
          as: 'deptDoc',
        },
      },
      { $unwind: { path: '$deptDoc', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          departmentId: '$_id',
          name: { $ifNull: ['$deptDoc.name', 'Unassigned'] },
          code: { $ifNull: ['$deptDoc.code', 'DEPT'] },
          total: 1,
          open: 1,
          resolved: 1,
          overdue: 1,
          totalFeedback: 1,
          satisfiedCount: 1,
          star5: '$star5Count',
          star4: '$star4Count',
          star3: '$star3Count',
          star2: '$star2Count',
          star1: '$star1Count',
          avgRating: {
            $cond: [
              { $gt: ['$totalFeedback', 0] },
              { $round: [{ $divide: ['$totalRatingSum', '$totalFeedback'] }, 1] },
              0,
            ],
          },
          satisfactionRate: {
            $cond: [
              { $gt: ['$totalFeedback', 0] },
              { $round: [{ $multiply: [{ $divide: ['$satisfiedCount', '$totalFeedback'] }, 100] }, 1] },
              0,
            ],
          },
          resolutionRate: {
            $cond: [
              { $gt: ['$total', 0] },
              { $round: [{ $multiply: [{ $divide: ['$resolved', '$total'] }, 100] }, 1] },
              0,
            ],
          },
        },
      },
      { $sort: { total: -1 } },
    ]),
    Ticket.aggregate([
      {
        $match: {
          ...match,
          'feedback.rating': { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$feedback.submittedAt' },
            month: { $month: '$feedback.submittedAt' },
          },
          totalFeedback: { $sum: 1 },
          totalRatingSum: { $sum: '$feedback.rating' },
          satisfiedCount: {
            $sum: { $cond: [{ $gte: ['$feedback.rating', 4] }, 1, 0] },
          },
          star5: { $sum: { $cond: [{ $eq: ['$feedback.rating', 5] }, 1, 0] } },
          star4: { $sum: { $cond: [{ $eq: ['$feedback.rating', 4] }, 1, 0] } },
          star3: { $sum: { $cond: [{ $eq: ['$feedback.rating', 3] }, 1, 0] } },
          star2: { $sum: { $cond: [{ $eq: ['$feedback.rating', 2] }, 1, 0] } },
          star1: { $sum: { $cond: [{ $eq: ['$feedback.rating', 1] }, 1, 0] } },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ]);

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  const monthlyTrend = monthlyTrendRaw.map((r) => ({
    month: `${monthNames[r._id.month - 1]} ${r._id.year}`,
    year: r._id.year,
    monthNum: r._id.month,
    created: r.created,
    resolved: r.resolved,
  }));

  const feedbackMonthlyTrend = feedbackMonthlyRaw.map((r) => {
    const avgRating = r.totalFeedback > 0 ? Number((r.totalRatingSum / r.totalFeedback).toFixed(1)) : 0;
    const satisfactionRate = r.totalFeedback > 0 ? Number(((r.satisfiedCount / r.totalFeedback) * 100).toFixed(1)) : 0;
    return {
      month: `${monthNames[r._id.month - 1]} ${r._id.year}`,
      year: r._id.year,
      monthNum: r._id.month,
      totalFeedback: r.totalFeedback,
      avgRating,
      satisfactionRate,
      star5: r.star5,
      star4: r.star4,
      star3: r.star3,
      star2: r.star2,
      star1: r.star1,
    };
  });

  const byPriority: Record<string, number> = {};
  byPriorityRows.forEach((r) => {
    if (r._id) byPriority[r._id] = r.count;
  });

  const totalFeedbackWithScore = deptPerformanceRaw.reduce((acc, d) => acc + d.totalFeedback, 0);
  const totalScoreSum = deptPerformanceRaw.reduce((acc, d) => acc + d.avgRating * d.totalFeedback, 0);
  const overallAvgRating = totalFeedbackWithScore > 0 ? Number((totalScoreSum / totalFeedbackWithScore).toFixed(1)) : 0;
  const resolutionRatePct = totalTickets > 0 ? Number(((resolvedTickets / totalTickets) * 100).toFixed(1)) : 0;

  return {
    totals: {
      tickets: totalTickets,
      open: openTickets,
      resolved: resolvedTickets,
      departments: departmentsCount,
      users: usersCount,
      overdue: overdueCount,
      resolutionRate: resolutionRatePct,
      avgRating: overallAvgRating,
      totalFeedback: totalFeedbackWithScore,
    },
    byStatus,
    byPriority,
    byDepartment,
    monthlyTrend,
    deptPerformance: deptPerformanceRaw,
    feedbackMonthlyTrend,
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
