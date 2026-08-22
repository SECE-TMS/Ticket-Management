export type Role = 'admin' | 'manager' | 'employee'

export type TicketStatus =
  | 'new'
  | 'assigned'
  | 'accepted'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'reopened'

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface ApiSuccess<T> {
  success: true
  data: T
  message: string
}

export interface ApiErrorBody {
  success: false
  error: { code: string; message: string }
}

export interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
  totalPages?: number
}

export interface Department {
  _id: string
  name: string
  description?: string
  complaintTypes: string[]
  slaHours: number
  isActive?: boolean
  manager?: UserRef | string | null
  createdAt?: string
  updatedAt?: string
}

export interface UserRef {
  _id?: string
  id?: string
  name: string
  email?: string
  phone?: string
  rollNumber?: string
  role?: Role
}

export interface User {
  id: string
  _id?: string
  name: string
  email: string
  role: Role
  department: Department | string | null
  phone?: string
  rollNumber?: string
  avatarUrl?: string
  isActive: boolean
  lastLogin?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface SystemSettings {
  smsOtpEnabled: boolean
  emailOtpEnabled?: boolean
  emailNotificationsEnabled: boolean
  feedbackEnabled: boolean
  notifyRequesterOnEveryAction: boolean
  requireRequesterEmail: boolean
  mobileMode: 'hidden' | 'optional' | 'required' | 'otp_required'
  emailMode: 'hidden' | 'optional' | 'required' | 'otp_required'
  notifyEvents: {
    created: boolean
    assigned: boolean
    statusChanged: boolean
    resolved: boolean
    closed: boolean
    reopened: boolean
    commented: boolean
  }
}

export interface Attachment {
  url: string
  type: 'image' | 'audio' | 'video'
  publicId?: string | null
}

export interface TicketFeedback {
  rating: number
  comment?: string
  tags?: string[]
  submittedAt: string
}

export interface DepartmentFeedbackAnalytics {
  _id: string
  departmentName: string
  departmentCode: string
  departmentIcon?: string
  totalFeedback: number
  avgRating: number
  satisfactionRate: number
  distribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}

export interface CategoryFeedbackAnalytics {
  _id: string
  categoryName: string
  totalFeedback: number
  avgRating: number
  satisfactionRate: number
  distribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
  departmentNames?: string[]
}

export interface FeedbackTimeTrendItem {
  year: number
  week?: number
  month?: number
  label: string
  category: string
  totalFeedback: number
  avgRating: number
  satisfactionRate: number
}

export interface TimeWiseFeedbackAnalytics {
  weekly: FeedbackTimeTrendItem[]
  monthly: FeedbackTimeTrendItem[]
}

export interface Ticket {
  _id: string
  ticketCode: string
  requester: {
    name: string
    mobile: string
    email?: string
    userType?: 'student' | 'staff' | 'guest'
    rollNumber?: string
  }
  department: Department | string
  complaintType: string
  description: string
  userAttachment?: Attachment | null
  userAttachments?: Attachment[]
  priority: TicketPriority
  status: TicketStatus
  assignedTo?: UserRef | string | null
  assignedBy?: UserRef | string | null
  expectedResolutionAt?: string | null
  resolution?: {
    remarks?: string
    attachment?: Attachment | null
    resolvedAt?: string | null
  }
  closedBy?: UserRef | string | null
  closedAt?: string | null
  reopenCount?: number
  feedback?: TicketFeedback | null
  comments?: Array<{
    _id?: string
    author: UserRef | string
    message: string
    createdAt: string
  }>
  createdAt: string
  updatedAt: string
}

export interface Activity {
  _id: string
  ticket: string
  actor?: UserRef | null
  action: string
  fromStatus?: string | null
  toStatus?: string | null
  message?: string
  createdAt: string
}

export interface NotificationItem {
  _id: string
  recipient: string
  ticket?: string | Ticket
  type: string
  message: string
  isRead: boolean
  createdAt: string
}

export interface DepartmentPerformance {
  departmentId: string
  name: string
  code: string
  total: number
  open: number
  resolved: number
  overdue: number
  totalFeedback: number
  avgRating: number
  satisfactionRate: number
  resolutionRate: number
  star5: number
  star4: number
  star3: number
  star2: number
  star1: number
}

export interface MonthlyTrend {
  month: string
  year: number
  monthNum: number
  created: number
  resolved: number
}

export interface FeedbackMonthlyTrend {
  month: string
  year: number
  monthNum: number
  totalFeedback: number
  avgRating: number
  satisfactionRate: number
  star5: number
  star4: number
  star3: number
  star2: number
  star1: number
}

export interface AdminDashboard {
  totals: {
    tickets: number
    open: number
    resolved: number
    departments: number
    users: number
    overdue: number
    resolutionRate: number
    avgRating: number
    totalFeedback: number
  }
  byStatus: Record<string, number>
  byPriority: Record<string, number>
  byDepartment: Array<{ departmentId: string; name: string; count: number }>
  monthlyTrend: MonthlyTrend[]
  deptPerformance: DepartmentPerformance[]
  feedbackMonthlyTrend: FeedbackMonthlyTrend[]
  recent: Ticket[]
}

export interface ManagerDashboard {
  totals: {
    open: number
    overdue: number
    unassigned: number
    employees: number
  }
  byStatus: Record<string, number>
  workload: Array<{ employeeId: string; name: string; openCount: number }>
  recent: Ticket[]
}

export interface EmployeeDashboard {
  totals: {
    open: number
    overdue: number
    resolved: number
  }
  byStatus: Record<string, number>
  recent: Ticket[]
}

export function getId(entity: { _id?: string; id?: string } | string | null | undefined): string {
  if (!entity) return ''
  if (typeof entity === 'string') return entity
  return entity._id || entity.id || ''
}

export function getName(
  entity: { name?: string } | string | null | undefined,
  fallback = '—'
): string {
  if (!entity) return fallback
  if (typeof entity === 'string') return fallback
  return entity.name || fallback
}
