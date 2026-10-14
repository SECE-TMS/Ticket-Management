import mongoose from 'mongoose';
import Ticket from '../../models/Ticket';
import ActivityLog from '../../models/ActivityLog';
import Notification from '../../models/Notification';
import type { IUserDocument } from '../../models/User';
import ApiError from '../../utils/apiError';
import { getSettings } from '../setting.service';
import { assertTicketAccess, populateTicket } from './ticketCommon';

export const submitFeedback = async (
  ticketCode: string,
  mobile: string,
  rating: number,
  comment?: string,
  tags?: string[]
) => {
  const settings = await getSettings();
  if (!settings.feedbackEnabled) {
    throw new ApiError(403, 'Ticket Feedback System is currently disabled by Admin.');
  }

  if (!rating || rating < 1 || rating > 5) {
    throw new ApiError(400, 'Rating must be between 1 and 5 stars.');
  }

  const cleanCode = String(ticketCode || '').trim().toUpperCase();
  const cleanMobile = String(mobile || '').trim();

  let ticket = await Ticket.findOne({
    ticketCode: cleanCode,
    'requester.mobile': cleanMobile,
  });

  if (!ticket) {
    ticket = await Ticket.findOne({ ticketCode: cleanCode });
    const normalizedTargetMobile = cleanMobile.replace(/\D/g, '');
    const normalizedTicketMobile = (ticket?.requester?.mobile || '').replace(/\D/g, '');

    if (
      !ticket ||
      (normalizedTargetMobile &&
        normalizedTicketMobile &&
        !normalizedTicketMobile.endsWith(normalizedTargetMobile) &&
        !normalizedTargetMobile.endsWith(normalizedTicketMobile))
    ) {
      throw new ApiError(404, 'Ticket not found. Check your reference code and mobile number.');
    }
  }

  if (ticket.status !== 'resolved' && ticket.status !== 'closed') {
    throw new ApiError(400, 'Feedback can only be submitted for resolved or closed tickets.');
  }

  ticket.feedback = {
    rating,
    comment: comment?.trim() || '',
    tags: tags || [],
    submittedAt: new Date(),
  };

  await ticket.save();

  try {
    await ActivityLog.create({
      ticket: ticket._id,
      actor: null,
      action: 'feedback_submitted',
      fromStatus: ticket.status,
      toStatus: ticket.status,
      message: `Customer submitted ${rating}-star rating: ${comment?.trim() || 'No comment'}`,
    });

    if (ticket.assignedTo) {
      await Notification.create({
        recipient: ticket.assignedTo,
        ticket: ticket._id,
        type: 'feedback_received',
        message: `⭐ Received ${rating}★ feedback for ticket ${ticket.ticketCode}${comment ? `: "${comment.slice(0, 60)}..."` : ''}`,
        channel: 'in_app',
      });
    }
  } catch (logErr) {
    console.error('Failed to log feedback activity/notification:', logErr);
  }

  return populateTicket(Ticket.findById(ticket._id));
};

export const submitFeedbackByStaff = async (
  ticketId: string,
  payload: { rating: number; comment?: string; tags?: string[] },
  actor?: IUserDocument
) => {
  const { rating, comment, tags } = payload;
  if (!rating || rating < 1 || rating > 5) {
    throw ApiError.badRequest('Rating must be between 1 and 5 stars.');
  }

  const ticket = await Ticket.findById(ticketId);
  if (!ticket) throw ApiError.notFound('Ticket not found');
  if (actor) assertTicketAccess(ticket, actor);

  ticket.feedback = {
    rating,
    comment: comment?.trim() || '',
    tags: tags || [],
    submittedAt: new Date(),
  };

  await ticket.save();

  try {
    await ActivityLog.create({
      ticket: ticket._id,
      actor: actor?._id || null,
      action: 'feedback_submitted',
      fromStatus: ticket.status,
      toStatus: ticket.status,
      message: `${actor ? actor.name : 'Staff'} recorded ${rating}-star feedback: ${comment?.trim() || 'No comment'}`,
    });

    if (ticket.assignedTo && (!actor || String(ticket.assignedTo) !== String(actor._id))) {
      await Notification.create({
        recipient: ticket.assignedTo,
        ticket: ticket._id,
        type: 'feedback_received',
        message: `⭐ Recorded ${rating}★ feedback for ticket ${ticket.ticketCode}${comment ? `: "${comment.slice(0, 60)}..."` : ''}`,
        channel: 'in_app',
      });
    }
  } catch (logErr) {
    console.error('Failed to log staff feedback activity/notification:', logErr);
  }

  return populateTicket(Ticket.findById(ticket._id));
};

const getFeedbackPeriodMatch = (query: Record<string, unknown>) => {
  const match: Record<string, unknown> = {
    'feedback.rating': { $exists: true, $ne: null },
  };

  if (query.from || query.to) {
    const dateFilter: Record<string, Date> = {};
    if (query.from) dateFilter.$gte = new Date(String(query.from));
    if (query.to) {
      const to = new Date(String(query.to));
      to.setHours(23, 59, 59, 999);
      dateFilter.$lte = to;
    }
    match['feedback.submittedAt'] = dateFilter;
  } else {
    const period = String(query.period || query.timeRange || '');
    const now = new Date();
    let startDate: Date | undefined;

    if (period === '7d' || period === 'week' || period === 'this_week') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 7);
    } else if (period === '30d' || period === 'month' || period === 'this_month') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 30);
    } else if (period === '90d') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 90);
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    if (startDate) {
      match['feedback.submittedAt'] = { $gte: startDate };
    }
  }

  if (query.department) {
    match.department =
      typeof query.department === 'string'
        ? new mongoose.Types.ObjectId(query.department)
        : query.department;
  }

  if (query.category || query.complaintType) {
    match.complaintType = String(query.category || query.complaintType);
  }

  return match;
};

export const getAdminFeedbackList = async (query: Record<string, unknown>) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {
    'feedback.rating': { $exists: true, $ne: null },
  };

  if (query.department) {
    filter.department = query.department;
  }
  if (query.category || query.complaintType) {
    filter.complaintType = query.category || query.complaintType;
  }
  if (query.rating) {
    filter['feedback.rating'] = Number(query.rating);
  }

  if (query.from || query.to) {
    const dateFilter: Record<string, Date> = {};
    if (query.from) dateFilter.$gte = new Date(String(query.from));
    if (query.to) {
      const to = new Date(String(query.to));
      to.setHours(23, 59, 59, 999);
      dateFilter.$lte = to;
    }
    filter['feedback.submittedAt'] = dateFilter;
  } else if (query.period || query.timeRange) {
    const period = String(query.period || query.timeRange);
    const now = new Date();
    let startDate: Date | undefined;
    if (period === '7d' || period === 'week' || period === 'this_week') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 7);
    } else if (period === '30d' || period === 'month' || period === 'this_month') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 30);
    } else if (period === '90d') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 90);
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    }
    if (startDate) {
      filter['feedback.submittedAt'] = { $gte: startDate };
    }
  }

  if (query.search) {
    const searchRegex = new RegExp(String(query.search).trim(), 'i');
    filter.$or = [
      { ticketCode: searchRegex },
      { complaintType: searchRegex },
      { 'requester.name': searchRegex },
      { 'requester.mobile': searchRegex },
      { 'feedback.comment': searchRegex },
    ];
  }

  const total = await Ticket.countDocuments(filter);
  const tickets = await Ticket.find(filter)
    .sort({ 'feedback.submittedAt': -1 })
    .skip(skip)
    .limit(limit)
    .populate('department', 'name code icon')
    .populate('assignedTo', 'name email avatar')
    .lean();

  return {
    tickets,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getDepartmentFeedbackAnalytics = async (query: Record<string, unknown> = {}) => {
  const match = getFeedbackPeriodMatch(query);

  const pipeline = [
    {
      $match: match,
    },
    {
      $group: {
        _id: '$department',
        totalFeedback: { $sum: 1 },
        avgRating: { $avg: '$feedback.rating' },
        star5Count: { $sum: { $cond: [{ $eq: ['$feedback.rating', 5] }, 1, 0] } },
        star4Count: { $sum: { $cond: [{ $eq: ['$feedback.rating', 4] }, 1, 0] } },
        star3Count: { $sum: { $cond: [{ $eq: ['$feedback.rating', 3] }, 1, 0] } },
        star2Count: { $sum: { $cond: [{ $eq: ['$feedback.rating', 2] }, 1, 0] } },
        star1Count: { $sum: { $cond: [{ $eq: ['$feedback.rating', 1] }, 1, 0] } },
        satisfiedCount: { $sum: { $cond: [{ $gte: ['$feedback.rating', 4] }, 1, 0] } },
      },
    },
    {
      $lookup: {
        from: 'departments',
        localField: '_id',
        foreignField: '_id',
        as: 'departmentDoc',
      },
    },
    {
      $unwind: '$departmentDoc',
    },
    {
      $project: {
        _id: 1,
        departmentName: '$departmentDoc.name',
        departmentCode: '$departmentDoc.code',
        departmentIcon: '$departmentDoc.icon',
        totalFeedback: 1,
        avgRating: { $round: ['$avgRating', 1] },
        satisfactionRate: {
          $round: [
            {
              $cond: [
                { $gt: ['$totalFeedback', 0] },
                { $multiply: [{ $divide: ['$satisfiedCount', '$totalFeedback'] }, 100] },
                0,
              ],
            },
            1,
          ],
        },
        distribution: {
          5: '$star5Count',
          4: '$star4Count',
          3: '$star3Count',
          2: '$star2Count',
          1: '$star1Count',
        },
      },
    },
    {
      $sort: { avgRating: -1, totalFeedback: -1 },
    },
  ];

  const analytics = await Ticket.aggregate(pipeline as any);
  return analytics;
};

export const getCategoryFeedbackAnalytics = async (query: Record<string, unknown> = {}) => {
  const match = getFeedbackPeriodMatch(query);

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: '$complaintType',
        totalFeedback: { $sum: 1 },
        avgRating: { $avg: '$feedback.rating' },
        star5Count: { $sum: { $cond: [{ $eq: ['$feedback.rating', 5] }, 1, 0] } },
        star4Count: { $sum: { $cond: [{ $eq: ['$feedback.rating', 4] }, 1, 0] } },
        star3Count: { $sum: { $cond: [{ $eq: ['$feedback.rating', 3] }, 1, 0] } },
        star2Count: { $sum: { $cond: [{ $eq: ['$feedback.rating', 2] }, 1, 0] } },
        star1Count: { $sum: { $cond: [{ $eq: ['$feedback.rating', 1] }, 1, 0] } },
        satisfiedCount: { $sum: { $cond: [{ $gte: ['$feedback.rating', 4] }, 1, 0] } },
        departments: { $addToSet: '$department' },
      },
    },
    {
      $lookup: {
        from: 'departments',
        localField: 'departments',
        foreignField: '_id',
        as: 'departmentDocs',
      },
    },
    {
      $project: {
        _id: 1,
        categoryName: '$_id',
        totalFeedback: 1,
        avgRating: { $round: ['$avgRating', 1] },
        satisfactionRate: {
          $round: [
            {
              $cond: [
                { $gt: ['$totalFeedback', 0] },
                { $multiply: [{ $divide: ['$satisfiedCount', '$totalFeedback'] }, 100] },
                0,
              ],
            },
            1,
          ],
        },
        distribution: {
          5: '$star5Count',
          4: '$star4Count',
          3: '$star3Count',
          2: '$star2Count',
          1: '$star1Count',
        },
        departmentNames: '$departmentDocs.name',
      },
    },
    {
      $sort: { avgRating: -1, totalFeedback: -1 },
    },
  ];

  const analytics = await Ticket.aggregate(pipeline as any);
  return analytics;
};

export const getTimeWiseFeedbackAnalytics = async (query: Record<string, unknown> = {}) => {
  const match = getFeedbackPeriodMatch(query);

  const weeklyPipeline = [
    { $match: match },
    {
      $group: {
        _id: {
          year: { $isoWeekYear: '$feedback.submittedAt' },
          week: { $isoWeek: '$feedback.submittedAt' },
          category: '$complaintType',
        },
        totalFeedback: { $sum: 1 },
        avgRating: { $avg: '$feedback.rating' },
        satisfiedCount: { $sum: { $cond: [{ $gte: ['$feedback.rating', 4] }, 1, 0] } },
      },
    },
    { $sort: { '_id.year': -1, '_id.week': -1 } },
  ];

  const monthlyPipeline = [
    { $match: match },
    {
      $group: {
        _id: {
          year: { $year: '$feedback.submittedAt' },
          month: { $month: '$feedback.submittedAt' },
          category: '$complaintType',
        },
        totalFeedback: { $sum: 1 },
        avgRating: { $avg: '$feedback.rating' },
        satisfiedCount: { $sum: { $cond: [{ $gte: ['$feedback.rating', 4] }, 1, 0] } },
      },
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
  ];

  const [weeklyRaw, monthlyRaw] = await Promise.all([
    Ticket.aggregate(weeklyPipeline as any),
    Ticket.aggregate(monthlyPipeline as any),
  ]);

  return {
    weekly: weeklyRaw.map((w: any) => ({
      year: w._id.year,
      week: w._id.week,
      label: `Week ${w._id.week}, ${w._id.year}`,
      category: w._id.category,
      totalFeedback: w.totalFeedback,
      avgRating: Number(w.avgRating.toFixed(1)),
      satisfactionRate: Number(((w.satisfiedCount / w.totalFeedback) * 100).toFixed(1)),
    })),
    monthly: monthlyRaw.map((m: any) => {
      const date = new Date(m._id.year, m._id.month - 1, 1);
      const monthName = date.toLocaleString('default', { month: 'short' });
      return {
        year: m._id.year,
        month: m._id.month,
        label: `${monthName} ${m._id.year}`,
        category: m._id.category,
        totalFeedback: m.totalFeedback,
        avgRating: Number(m.avgRating.toFixed(1)),
        satisfactionRate: Number(((m.satisfiedCount / m.totalFeedback) * 100).toFixed(1)),
      };
    }),
  };
};
