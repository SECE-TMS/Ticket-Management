import mongoose from 'mongoose';
import User, { type IUserDocument } from '../models/User';
import Department from '../models/Department';
import Ticket from '../models/Ticket';
import ApiError from '../utils/apiError';

// ─── Admin Management ────────────────────────────────────────────────────────

export const listAdmins = async (query: Record<string, unknown> = {}) => {
  const filter: Record<string, unknown> = { role: 'admin' };
  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === 'true' || query.isActive === true;
  }
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
    ];
  }

  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    User.find(filter)
      .populate('department', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return {
    items: items.map((u) => u.toSafeObject()),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  };
};

export const createAdmin = async (data: Record<string, unknown>, actor: IUserDocument) => {
  if (actor.role !== 'superadmin') {
    throw ApiError.forbidden('Only superadmin can create admin accounts');
  }

  const existing = await User.findOne({ email: String(data.email).toLowerCase() });
  if (existing) throw ApiError.conflict('Email already registered');

  const user = await User.create({
    name: data.name,
    email: String(data.email).toLowerCase(),
    password: data.password,
    phone: (data.phone as string) || '',
    role: 'admin',
    department: null,
    createdBy: actor._id,
  });

  const populated = await User.findById(user._id).populate('department', 'name');
  if (!populated) throw ApiError.notFound('User not found');
  return populated.toSafeObject();
};

export const updateAdmin = async (
  id: string,
  data: Record<string, unknown>,
  actor: IUserDocument
) => {
  if (actor.role !== 'superadmin') {
    throw ApiError.forbidden('Only superadmin can update admin accounts');
  }

  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('Admin not found');
  if (user.role !== 'admin') throw ApiError.badRequest('User is not an admin');

  // Don't allow changing role or password through this endpoint
  const allowed: Array<'name' | 'phone' | 'isActive'> = ['name', 'phone', 'isActive'];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      (user[key] as unknown) = data[key];
    }
  }

  await user.save();
  const populated = await User.findById(user._id).populate('department', 'name');
  if (!populated) throw ApiError.notFound('User not found');
  return populated.toSafeObject();
};

export const toggleAdminStatus = async (id: string, isActive: boolean, actor: IUserDocument) => {
  if (actor.role !== 'superadmin') {
    throw ApiError.forbidden('Only superadmin can toggle admin status');
  }

  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('Admin not found');
  if (user.role !== 'admin') throw ApiError.badRequest('User is not an admin');

  user.isActive = isActive;
  await user.save();
  return user.toSafeObject();
};

export const resetAdminPassword = async (
  id: string,
  newPassword: string,
  actor: IUserDocument
) => {
  if (actor.role !== 'superadmin') {
    throw ApiError.forbidden('Only superadmin can reset admin passwords');
  }

  const user = await User.findById(id).select('+password');
  if (!user) throw ApiError.notFound('Admin not found');
  if (user.role !== 'admin') throw ApiError.badRequest('User is not an admin');

  user.password = newPassword;
  user.mustChangePassword = true;
  await user.save();
  return { message: 'Password reset successfully' };
};

// ─── Department-wise Reports ─────────────────────────────────────────────────

export const getDepartmentReport = async () => {
  const departments = await Department.find().populate('manager', 'name email').lean();

  const report = await Promise.all(
    departments.map(async (dept) => {
      const deptId = dept._id;

      // Ticket stats per department
      const [total, open, resolved, closed, overdue, pendingApproval] = await Promise.all([
        Ticket.countDocuments({ department: deptId }),
        Ticket.countDocuments({
          department: deptId,
          status: { $in: ['new', 'assigned', 'accepted', 'in_progress', 'reopened'] },
        }),
        Ticket.countDocuments({ department: deptId, status: 'resolved' }),
        Ticket.countDocuments({ department: deptId, status: 'closed' }),
        Ticket.countDocuments({
          department: deptId,
          status: { $in: ['new', 'assigned', 'accepted', 'in_progress', 'reopened'] },
          expectedResolutionAt: { $lt: new Date() },
        }),
        Ticket.countDocuments({ department: deptId, status: 'pending_approval' }),
      ]);

      // Average feedback rating
      const feedbackAgg = await Ticket.aggregate([
        { $match: { department: new mongoose.Types.ObjectId(String(deptId)), 'feedback.rating': { $exists: true, $ne: null } } },
        { $group: { _id: null, avgRating: { $avg: '$feedback.rating' }, totalFeedback: { $sum: 1 } } },
      ]);
      const avgRating = feedbackAgg[0]?.avgRating ?? 0;
      const totalFeedback = feedbackAgg[0]?.totalFeedback ?? 0;

      // Staff counts
      const [managerCount, employeeCount] = await Promise.all([
        User.countDocuments({ department: deptId, role: 'manager', isActive: true }),
        User.countDocuments({ department: deptId, role: 'employee', isActive: true }),
      ]);

      return {
        departmentId: String(deptId),
        name: dept.name,
        description: dept.description,
        isActive: dept.isActive,
        manager: dept.manager,
        stats: {
          total,
          open,
          resolved,
          closed,
          pendingApproval,
          overdue,
          resolutionRate: total > 0 ? Math.round(((resolved + closed) / total) * 100) : 0,
          avgRating: Math.round(avgRating * 10) / 10,
          totalFeedback,
        },
        staff: {
          managers: managerCount,
          employees: employeeCount,
          total: managerCount + employeeCount,
        },
      };
    })
  );

  return report;
};

export const getSuperAdminDashboard = async () => {
  // Overall system totals
  const [
    totalUsers,
    totalAdmins,
    totalManagers,
    totalEmployees,
    totalTickets,
    openTickets,
    closedTickets,
    pendingApprovalTickets,
    overdueTickets,
  ] = await Promise.all([
    User.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'admin', isActive: true }),
    User.countDocuments({ role: 'manager', isActive: true }),
    User.countDocuments({ role: 'employee', isActive: true }),
    Ticket.countDocuments({}),
    Ticket.countDocuments({ status: { $in: ['new', 'assigned', 'accepted', 'in_progress', 'reopened'] } }),
    Ticket.countDocuments({ status: 'closed' }),
    Ticket.countDocuments({ status: 'pending_approval' }),
    Ticket.countDocuments({
      status: { $in: ['new', 'assigned', 'accepted', 'in_progress', 'reopened'] },
      expectedResolutionAt: { $lt: new Date() },
    }),
  ]);

  // Monthly ticket trend (last 6 months continuous timeline)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const monthlyTrendAgg = await Ticket.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        created: { $sum: 1 },
        resolved: { $sum: { $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 1, 0] } },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const trendMap = new Map<string, { created: number; resolved: number }>();
  monthlyTrendAgg.forEach((item) => {
    trendMap.set(`${item._id.year}-${item._id.month}`, {
      created: item.created,
      resolved: item.resolved,
    });
  });

  const monthlyTrend = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yr = d.getFullYear();
    const mo = d.getMonth() + 1;
    const match = trendMap.get(`${yr}-${mo}`) || { created: 0, resolved: 0 };
    monthlyTrend.push({
      _id: { year: yr, month: mo },
      created: match.created,
      resolved: match.resolved,
    });
  }

  const departmentReport = await getDepartmentReport();

  return {
    totals: {
      users: totalUsers,
      admins: totalAdmins,
      managers: totalManagers,
      employees: totalEmployees,
      tickets: totalTickets,
      openTickets,
      closedTickets,
      pendingApprovalTickets,
      overdueTickets,
    },
    monthlyTrend,
    departmentReport,
  };
};
