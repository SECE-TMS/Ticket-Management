import Department from '../models/Department';
import Ticket, { OPEN_STATUSES } from '../models/Ticket';
import User, { getUserDepartmentIds, type IUserDocument } from '../models/User';
import ApiError from '../utils/apiError';

export const listActive = async () => {
  return Department.find({ isActive: true, isDeleted: { $ne: true } })
    .select('name description complaintTypes slaHours locationEnabled blocks defaultAssignee')
    .populate('defaultAssignee', 'name email role')
    .populate('blocks.floors.defaultAssignee', 'name email role')
    .sort({ name: 1 })
    .lean();
};

export const listAll = async () => {
  return Department.find({ isDeleted: { $ne: true } })
    .populate('manager', 'name email')
    .populate('defaultAssignee', 'name email role')
    .populate('blocks.floors.defaultAssignee', 'name email role')
    .sort({ name: 1 })
    .lean();
};

export const getById = async (id: string, actor: IUserDocument) => {
  const dept = await Department.findOne({ _id: id, isDeleted: { $ne: true } })
    .populate('manager', 'name email phone')
    .populate('defaultAssignee', 'name email role')
    .populate('blocks.floors.defaultAssignee', 'name email role');
  if (!dept) throw ApiError.notFound('Department not found');

  if (actor.role === 'manager') {
    const userDepts = getUserDepartmentIds(actor);
    if (!userDepts.includes(String(dept._id))) {
      throw ApiError.forbidden('Access limited to your department(s)');
    }
  }

  return dept;
};

export const create = async (data: Record<string, unknown>) => {
  const exists = await Department.findOne({ name: data.name as string, isDeleted: { $ne: true } });
  if (exists) throw ApiError.conflict('Department name already exists');
  if (data.defaultAssignee === '' || data.defaultAssignee === 'none') {
    data.defaultAssignee = null;
  }
  if (data.manager === '' || data.manager === 'none') {
    data.manager = null;
  }
  if (Array.isArray(data.blocks)) {
    data.blocks = (data.blocks as any[]).map((b) => ({
      ...b,
      blockName: typeof b.blockName === 'string' ? b.blockName.trim() : b.blockName,
      floors: Array.isArray(b.floors)
        ? b.floors.map((fl: any) => ({
            ...fl,
            floorName: typeof fl.floorName === 'string' ? fl.floorName.trim() : fl.floorName,
            defaultAssignee:
              fl.defaultAssignee && fl.defaultAssignee !== '' && fl.defaultAssignee !== 'none'
                ? fl.defaultAssignee
                : null,
          }))
        : [],
    }));
  }
  const created = await Department.create(data);
  return Department.findById(created._id)
    .populate('manager', 'name email')
    .populate('defaultAssignee', 'name email role')
    .populate('blocks.floors.defaultAssignee', 'name email role');
};

export const update = async (id: string, data: Record<string, unknown>) => {
  if (data.name) {
    const existingName = await Department.findOne({
      name: data.name as string,
      _id: { $ne: id },
      isDeleted: { $ne: true },
    });
    if (existingName) throw ApiError.conflict('Department name already exists');
  }

  if (data.defaultAssignee === '' || data.defaultAssignee === 'none') {
    data.defaultAssignee = null;
  }
  if (data.manager === '' || data.manager === 'none') {
    data.manager = null;
  }
  if (Array.isArray(data.blocks)) {
    data.blocks = (data.blocks as any[]).map((b) => ({
      ...b,
      blockName: typeof b.blockName === 'string' ? b.blockName.trim() : b.blockName,
      floors: Array.isArray(b.floors)
        ? b.floors.map((fl: any) => ({
            ...fl,
            floorName: typeof fl.floorName === 'string' ? fl.floorName.trim() : fl.floorName,
            defaultAssignee:
              fl.defaultAssignee && fl.defaultAssignee !== '' && fl.defaultAssignee !== 'none'
                ? fl.defaultAssignee
                : null,
          }))
        : [],
    }));
  }
  const dept = await Department.findOneAndUpdate({ _id: id, isDeleted: { $ne: true } }, data, {
    new: true,
    runValidators: true,
  })
    .populate('manager', 'name email')
    .populate('defaultAssignee', 'name email role')
    .populate('blocks.floors.defaultAssignee', 'name email role');
  if (!dept) throw ApiError.notFound('Department not found');
  return dept;
};

export const updateStatus = async (id: string, isActive: boolean) => {
  const dept = await Department.findOneAndUpdate(
    { _id: id, isDeleted: { $ne: true } },
    { isActive },
    { new: true, runValidators: true }
  );
  if (!dept) throw ApiError.notFound('Department not found');
  return dept;
};

export const remove = async (id: string) => {
  const dept = await Department.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!dept) throw ApiError.notFound('Department not found');

  const openCount = await Ticket.countDocuments({
    department: id,
    status: { $in: [...OPEN_STATUSES] },
    isDeleted: { $ne: true },
  });
  if (openCount > 0) {
    throw ApiError.conflict(`Cannot delete department with ${openCount} open ticket(s)`);
  }

  // Soft delete only: keep department name and all related records intact
  dept.isDeleted = true;
  dept.deletedAt = new Date();
  dept.isActive = false;
  await dept.save();

  return dept;
};
