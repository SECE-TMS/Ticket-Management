import Department from '../models/Department';
import Ticket, { OPEN_STATUSES } from '../models/Ticket';
import ApiError from '../utils/apiError';
import type { IUserDocument } from '../models/User';

export const listActive = async () => {
  return Department.find({ isActive: true })
    .select('name description complaintTypes slaHours')
    .sort({ name: 1 })
    .lean();
};

export const listAll = async () => {
  return Department.find()
    .populate('manager', 'name email')
    .sort({ name: 1 })
    .lean();
};

export const getById = async (id: string, actor: IUserDocument) => {
  const dept = await Department.findById(id).populate('manager', 'name email phone');
  if (!dept) throw ApiError.notFound('Department not found');

  if (actor.role === 'manager') {
    const userDept = actor.department ? String(actor.department) : null;
    if (userDept !== String(dept._id)) {
      throw ApiError.forbidden('Access limited to your department');
    }
  }

  return dept;
};

export const create = async (data: Record<string, unknown>) => {
  const exists = await Department.findOne({ name: data.name as string });
  if (exists) throw ApiError.conflict('Department name already exists');
  return Department.create(data);
};

export const update = async (id: string, data: Record<string, unknown>) => {
  const dept = await Department.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).populate('manager', 'name email');
  if (!dept) throw ApiError.notFound('Department not found');
  return dept;
};

export const updateStatus = async (id: string, isActive: boolean) => {
  const dept = await Department.findByIdAndUpdate(
    id,
    { isActive },
    { new: true, runValidators: true }
  );
  if (!dept) throw ApiError.notFound('Department not found');
  return dept;
};

export const remove = async (id: string) => {
  const openCount = await Ticket.countDocuments({
    department: id,
    status: { $in: [...OPEN_STATUSES] },
  });
  if (openCount > 0) {
    throw ApiError.conflict(`Cannot delete department with ${openCount} open ticket(s)`);
  }

  const dept = await Department.findByIdAndDelete(id);
  if (!dept) throw ApiError.notFound('Department not found');
  return dept;
};
