import User, { getUserDepartmentIds, type IUserDocument } from '../models/User';
import Department from '../models/Department';
import Ticket from '../models/Ticket';
import Task from '../models/Task';
import ApiError from '../utils/apiError';

export const listUsers = async (query: Record<string, unknown> = {}) => {
  const conditions: Array<Record<string, unknown>> = [
    { role: { $ne: 'superadmin' } },
    { isDeleted: { $ne: true } },
  ];

  if (query.role && query.role !== 'superadmin') {
    conditions.push({ role: query.role });
  }
  if (query.department) {
    conditions.push({
      $or: [
        { department: query.department },
        { departments: query.department },
      ],
    });
  }
  if (query.isActive !== undefined) {
    conditions.push({ isActive: query.isActive === 'true' || query.isActive === true });
  }
  if (query.search) {
    conditions.push({
      $or: [
        { name: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
        { rollNumber: { $regex: query.search, $options: 'i' } },
      ],
    });
  }

  const filter = { $and: conditions };

  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    User.find(filter)
      .populate('department', 'name')
      .populate('departments', 'name')
      .populate('managers', 'name email phone role')
      .populate('employees', 'name email phone role')
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

export const listByDepartment = async (deptId: string, actor: IUserDocument) => {
  if (actor.role === 'manager') {
    const userDepts = getUserDepartmentIds(actor);
    if (!userDepts.includes(String(deptId))) {
      throw ApiError.forbidden('Access limited to your department(s)');
    }
  }

  const dept = await Department.findOne({ _id: deptId, isDeleted: { $ne: true } });
  if (!dept) throw ApiError.notFound('Department not found');

  const users = await User.find({
    $or: [{ department: deptId }, { departments: deptId }],
    role: { $ne: 'admin' },
    isDeleted: { $ne: true },
  })
    .populate('department', 'name')
    .populate('departments', 'name')
    .populate('managers', 'name email phone role')
    .populate('employees', 'name email phone role')
    .sort({ role: 1, name: 1 });

  return users.map((u) => u.toSafeObject());
};

export const listAssignees = async (actor: IUserDocument, search?: string) => {
  const conditions: Array<Record<string, unknown>> = [
    { role: { $in: ['employee', 'manager'] } },
    { isActive: true },
    { isDeleted: { $ne: true } },
  ];

  if (search && search.trim()) {
    const s = search.trim();
    conditions.push({
      $or: [
        { name: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { phone: { $regex: s, $options: 'i' } },
        { rollNumber: { $regex: s, $options: 'i' } },
      ],
    });
  }

  const filter = { $and: conditions };

  const users = await User.find(filter)
    .populate('department', 'name complaintTypes')
    .populate('departments', 'name complaintTypes')
    .sort({ name: 1 })
    .limit(500);

  return users.map((u) => u.toSafeObject());
};

export const createUser = async (data: Record<string, unknown>, actor: IUserDocument) => {
  if (data.role === 'admin') {
    throw ApiError.badRequest('Cannot create admin via API');
  }

  const rawDepts =
    Array.isArray(data.departments) && data.departments.length > 0
      ? (data.departments as string[]).map(String)
      : data.department
        ? [String(data.department)]
        : [];

  if (rawDepts.length === 0) {
    throw ApiError.badRequest('At least one department is required');
  }

  const depts = await Department.find({ _id: { $in: rawDepts }, isDeleted: { $ne: true } });
  if (depts.length !== rawDepts.length) {
    throw ApiError.notFound('One or more selected departments not found');
  }

  const existing = await User.findOne({
    email: String(data.email).toLowerCase(),
    isDeleted: { $ne: true },
  });
  if (existing) throw ApiError.conflict('Email already registered');

  const user = await User.create({
    ...data,
    department: rawDepts[0],
    departments: rawDepts,
    email: String(data.email).toLowerCase(),
    createdBy: actor._id,
  });

  if (data.role === 'manager') {
    await Department.updateMany(
      { _id: { $in: rawDepts } },
      { $set: { manager: user._id } }
    );
    if (Array.isArray(data.employees) && data.employees.length > 0) {
      await User.updateMany(
        { _id: { $in: data.employees } },
        { $addToSet: { managers: user._id } }
      );
    }
  } else if (data.role === 'employee') {
    if (Array.isArray(data.managers) && data.managers.length > 0) {
      await User.updateMany(
        { _id: { $in: data.managers } },
        { $addToSet: { employees: user._id } }
      );
    }
  }

  const populated = await User.findById(user._id)
    .populate('department', 'name')
    .populate('departments', 'name')
    .populate('managers', 'name email phone role')
    .populate('employees', 'name email phone role');
  if (!populated) throw ApiError.notFound('User not found');
  return populated.toSafeObject();
};

export const createEmployee = async (data: Record<string, unknown>, actor: IUserDocument) => {
  if (actor.role !== 'manager') {
    throw ApiError.forbidden('Only managers can create employees in their department');
  }
  const managerDepts = getUserDepartmentIds(actor);
  if (managerDepts.length === 0) {
    throw ApiError.badRequest('Manager has no department assigned');
  }

  const rawDepts =
    Array.isArray(data.departments) && data.departments.length > 0
      ? (data.departments as string[]).map(String)
      : data.department
        ? [String(data.department)]
        : [managerDepts[0]];

  for (const d of rawDepts) {
    if (!managerDepts.includes(d)) {
      throw ApiError.forbidden('You can only assign employees to department(s) you manage');
    }
  }

  const existing = await User.findOne({
    email: String(data.email).toLowerCase(),
    isDeleted: { $ne: true },
  });
  if (existing) throw ApiError.conflict('Email already registered');

  const userManagers =
    Array.isArray(data.managers) && data.managers.length > 0
      ? data.managers
      : [actor._id];

  const user = await User.create({
    name: data.name,
    email: String(data.email).toLowerCase(),
    password: data.password,
    phone: (data.phone as string) || '',
    rollNumber: (data.rollNumber as string) || '',
    role: 'employee',
    department: rawDepts[0],
    departments: rawDepts,
    managers: userManagers,
    createdBy: actor._id,
  });

  await User.updateMany(
    { _id: { $in: userManagers } },
    { $addToSet: { employees: user._id } }
  );

  const populated = await User.findById(user._id)
    .populate('department', 'name')
    .populate('departments', 'name')
    .populate('managers', 'name email phone role')
    .populate('employees', 'name email phone role');
  if (!populated) throw ApiError.notFound('User not found');
  return populated.toSafeObject();
};

export const getById = async (id: string, actor: IUserDocument) => {
  const user = await User.findOne({ _id: id, isDeleted: { $ne: true } })
    .populate('department', 'name')
    .populate('departments', 'name')
    .populate('managers', 'name email phone role')
    .populate('employees', 'name email phone role');
  if (!user) throw ApiError.notFound('User not found');

  if (actor.role === 'manager') {
    const managerDepts = getUserDepartmentIds(actor);
    const targetDepts = getUserDepartmentIds(user);
    const sharesDept = targetDepts.some((d) => managerDepts.includes(d));
    if (String(user._id) !== String(actor._id) && !sharesDept) {
      throw ApiError.forbidden('Access limited to your department(s)');
    }
  } else if (actor.role === 'employee' && String(user._id) !== String(actor._id)) {
    throw ApiError.forbidden();
  }

  return user.toSafeObject();
};

export const updateUser = async (
  id: string,
  data: Record<string, unknown>,
  actor: IUserDocument
) => {
  const user = await User.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!user) throw ApiError.notFound('User not found');

  if (user.role === 'superadmin') {
    throw ApiError.forbidden('Superadmin accounts can only be managed via the Super Admin portal');
  }

  if (actor.role === 'employee' && String(user._id) !== String(actor._id)) {
    throw ApiError.forbidden();
  }

  if (actor.role === 'manager') {
    const managerDepts = getUserDepartmentIds(actor);
    const targetDepts = getUserDepartmentIds(user);
    const sharesDept = targetDepts.some((d) => managerDepts.includes(d));
    if (String(user._id) !== String(actor._id) && !sharesDept) {
      throw ApiError.forbidden('Access limited to your department(s)');
    }
    delete data.role;
    delete data.department;
    delete data.departments;
  }

  if (actor.role !== 'admin' && actor.role !== 'superadmin') {
    delete data.role;
    delete data.department;
    delete data.departments;
  }

  if (!data.password) {
    delete data.password;
  }

  if (data.email) {
    const normalizedEmail = String(data.email).trim().toLowerCase();
    if (normalizedEmail !== user.email) {
      const existing = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
        isDeleted: { $ne: true },
      });
      if (existing) {
        throw ApiError.conflict('Email already registered');
      }
      data.email = normalizedEmail;
    } else {
      delete data.email;
    }
  }

  if (Array.isArray(data.departments) && data.departments.length > 0) {
    data.department = data.departments[0];
  } else if (data.department) {
    data.departments = [data.department];
  }

  // Handle relationship synchronization
  if (data.role === 'employee' || user.role === 'employee') {
    if (Array.isArray(data.managers)) {
      // Remove user from managers not in the new list
      await User.updateMany(
        { role: 'manager', _id: { $nin: data.managers } },
        { $pull: { employees: user._id } }
      );
      // Add user to all selected managers
      await User.updateMany(
        { role: 'manager', _id: { $in: data.managers } },
        { $addToSet: { employees: user._id } }
      );
    }
  } else if (data.role === 'manager' || user.role === 'manager') {
    if (Array.isArray(data.employees)) {
      // Remove manager from employees not in the new list
      await User.updateMany(
        { role: 'employee', _id: { $nin: data.employees } },
        { $pull: { managers: user._id } }
      );
      // Add manager to all selected employees
      await User.updateMany(
        { role: 'employee', _id: { $in: data.employees } },
        { $addToSet: { managers: user._id } }
      );
    }
  }

  Object.assign(user, data);
  await user.save();
  const populated = await User.findById(user._id)
    .populate('department', 'name')
    .populate('departments', 'name')
    .populate('managers', 'name email phone role')
    .populate('employees', 'name email phone role');
  if (!populated) throw ApiError.notFound('User not found');
  return populated.toSafeObject();
};

export const updateStatus = async (id: string, isActive: boolean) => {
  const user = await User.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!user) throw ApiError.notFound('User not found');
  if (user.role === 'superadmin') {
    throw ApiError.forbidden('Cannot modify superadmin user status');
  }
  if (user.role === 'admin' && !isActive) {
    throw ApiError.badRequest('Cannot deactivate admin account');
  }
  user.isActive = isActive;
  await user.save();
  return user.toSafeObject();
};

export const removeUser = async (id: string, actor: IUserDocument) => {
  const user = await User.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!user) throw ApiError.notFound('User not found');

  if (user.role === 'superadmin') {
    throw ApiError.forbidden('Cannot delete superadmin account');
  }

  if (user.role === 'admin' && actor.role !== 'superadmin') {
    throw ApiError.forbidden('Only superadmin can delete admin accounts');
  }

  if (actor.role === 'manager') {
    if (user.role !== 'employee') {
      throw ApiError.forbidden('Managers can only delete employee accounts');
    }
    const managerDepts = getUserDepartmentIds(actor);
    const userDepts = getUserDepartmentIds(user);
    const sharesDept = userDepts.some((d) => managerDepts.includes(d));
    if (!sharesDept) {
      throw ApiError.forbidden('Cannot delete employee outside your department');
    }
  }

  if (String(actor._id) === String(user._id)) {
    throw ApiError.badRequest('Cannot delete your own account');
  }

  // Soft delete: mark as deleted, deactivate, free email for future use, and preserve audit trail
  user.isDeleted = true;
  user.deletedAt = new Date();
  user.isActive = false;
  user.originalEmail = user.email;
  user.email = `deleted_${Date.now()}_${user.email}`;

  // Clean up references and assignments
  await Promise.all([
    User.updateMany({ employees: user._id }, { $pull: { employees: user._id } }),
    User.updateMany({ managers: user._id }, { $pull: { managers: user._id } }),
    Department.updateMany({ defaultAssignee: user._id }, { $set: { defaultAssignee: null } }),
    Department.updateMany({ manager: user._id }, { $set: { manager: null } }),
    Department.updateMany(
      { 'blocks.floors.defaultAssignee': user._id },
      { $set: { 'blocks.$[].floors.$[fl].defaultAssignee': null } },
      { arrayFilters: [{ 'fl.defaultAssignee': user._id }] }
    ),
    Ticket.updateMany(
      { assignedTo: user._id, status: { $in: ['assigned', 'accepted'] }, isDeleted: { $ne: true } },
      { $set: { assignedTo: null, status: 'new' } }
    ),
    Task.updateMany(
      { assignedTo: user._id, status: { $in: ['pending', 'in_progress'] }, isDeleted: { $ne: true } },
      { $set: { status: 'cancelled', cancelledReason: 'Assignee account was deleted' } }
    ),
  ]);

  await user.save();
  return { id, message: 'User deleted successfully' };
};

export const changePassword = async (
  id: string,
  { currentPassword, newPassword }: { currentPassword: string; newPassword: string },
  actor: IUserDocument
) => {
  if (String(actor._id) !== String(id) && actor.role !== 'admin' && actor.role !== 'superadmin') {
    throw ApiError.forbidden();
  }

  const user = await User.findOne({ _id: id, isDeleted: { $ne: true } }).select('+password');
  if (!user) throw ApiError.notFound('User not found');

  if (String(actor._id) === String(id)) {
    const ok = await user.comparePassword(currentPassword);
    if (!ok) throw ApiError.badRequest('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();
  return { message: 'Password updated' };
};
