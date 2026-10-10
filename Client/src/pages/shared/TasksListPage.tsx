import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import {
  Calendar,
  CheckCircle2,
  CheckSquare,
  Clock,
  ExternalLink,
  Inbox,
  MessageCircle,
  Plus,
  Search,
  Send,
  User,
} from 'lucide-react'
import { taskService, type TaskListParams } from '../../services/taskService'
import { departmentService } from '../../services/departmentService'
import { KpiCard, PageHeader } from '../../components/common/KpiCard'
import { Button } from '../../components/common/Button'
import { Pagination } from '../../components/common/Pagination'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { PriorityBadge, StatusBadge } from '../../components/common/Badge'
import { CreateTaskModal } from '../../components/tasks/CreateTaskModal'
import { useToast } from '../../context/ToastContext'
import { useAppSelector } from '../../store/hooks'
import { getErrorMessage } from '../../lib/utils'
import type { Department, Task, TaskPriority, TaskStats, TaskStatus } from '../../types'
import { getName } from '../../types'

interface TasksListPageProps {
  detailBase: string
  title?: string
  description?: string
}

export function TasksListPage({
  detailBase,
  title = 'Tasks & Work Assignments',
  description = 'Manage specific assigned tasks, step-by-step checklists, and real-time execution.',
}: TasksListPageProps) {
  const toast = useToast()
  const navigate = useNavigate()
  const user = useAppSelector((s) => s.auth.user)
  const role = user?.role
  const canCreate = role === 'admin' || role === 'superadmin' || role === 'manager' || role === 'employee'

  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
  })
  const [departments, setDepartments] = useState<Department[]>([])
  const [createModalOpen, setCreateModalOpen] = useState(false)

  // Filters & Pagination
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState<TaskStatus | ''>('')
  const [priority, setPriority] = useState<TaskPriority | ''>('')
  const [department, setDepartment] = useState('')
  const [limit, setLimit] = useState(10)

  // Debounce search
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 300)
    return () => window.clearTimeout(t)
  }, [search])

  // Load departments if admin
  useEffect(() => {
    if (role === 'admin' || role === 'superadmin') {
      departmentService.listAll().then(setDepartments).catch(() => {})
    }
  }, [role])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: TaskListParams = {
        page,
        limit,
        search: debouncedSearch || undefined,
        status: status || undefined,
        priority: priority || undefined,
        department: department || undefined,
      }
      const data = await taskService.list(params)
      setTasks(data.items)
      setPages(data.pagination.pages)
      setTotal(data.pagination.total)
      if (data.stats) {
        setStats(data.stats)
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load tasks'))
    } finally {
      setLoading(false)
    }
  }, [page, limit, debouncedSearch, status, priority, department, toast])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, status, priority, department, limit])

  const handleOpenWhatsApp = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation()
    const employeePhone = (task.assignedTo as any)?.phone || ''
    if (!employeePhone) {
      toast.error('No phone number registered for this employee.')
      return
    }

    const cleanPhone = employeePhone.replace(/\D/g, '').slice(-10)
    const clientOrigin = window.location.origin
    const taskUrl = `${clientOrigin}/employee/tasks/${task._id}`
    const msg = `*TMS Task Assignment Notice*\n\nHello *${getName(task.assignedTo)}*,\nYou have been assigned a task:\n\n📋 *Task:* ${task.taskCode} - ${task.title}\n⚡ *Priority:* ${task.priority.toUpperCase()}\n⏰ *Due Date:* ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Standard'}\n\n*Instructions:*\n${task.description.slice(0, 150)}${task.description.length > 150 ? '...' : ''}\n\n👉 *View & Work on Task:* ${taskUrl}`

    const waUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`
    window.open(waUrl, '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={title}
        description={description}
        actions={
          canCreate ? (
            <Button
              size="md"
              onClick={() => setCreateModalOpen(true)}
              className="gap-2 shadow-sm"
              id="btn-assign-specific-task"
            >
              <Plus size={16} /> Assign Specific Task
            </Button>
          ) : undefined
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Tasks"
          value={stats.total}
          icon={CheckSquare}
          accent="blue"
        />
        <KpiCard
          label="Pending Start"
          value={stats.pending}
          icon={Clock}
          accent="gold"
        />
        <KpiCard
          label="In Progress"
          value={stats.in_progress}
          icon={Send}
          accent="blue"
        />
        <KpiCard
          label="Completed"
          value={stats.completed}
          icon={CheckCircle2}
          accent="success"
        />
      </div>

      {/* Filters Bar */}
      <div className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--white)] p-4 shadow-xs sm:grid-cols-2 lg:grid-cols-5">
        {/* Search */}
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="task-search" className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
            Search Tasks
          </label>
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--ink-muted)]"
            />
            <input
              id="task-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Task code, title, instructions..."
              className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--white)] pl-9 pr-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex flex-col gap-1">
          <label htmlFor="task-status-filter" className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
            Status
          </label>
          <select
            id="task-status-filter"
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus | '')}
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--white)] px-3 text-sm text-[var(--ink)] outline-none cursor-pointer focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className="flex flex-col gap-1">
          <label htmlFor="task-priority-filter" className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
            Priority
          </label>
          <select
            id="task-priority-filter"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority | '')}
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--white)] px-3 text-sm text-[var(--ink)] outline-none cursor-pointer focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Department Filter (Admin only) */}
        {(role === 'admin' || role === 'superadmin') && (
          <div className="flex flex-col gap-1">
            <label htmlFor="task-dept-filter" className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
              Department
            </label>
            <select
              id="task-dept-filter"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--white)] px-3 text-sm text-[var(--ink)] outline-none cursor-pointer focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Task List / Content */}
      {loading ? (
        <PageLoader />
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--white)] shadow-xs">
          <div className="flex flex-col items-center justify-center p-12 text-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary-blue-light)] text-[var(--primary-blue)]">
              <Inbox size={24} />
            </div>
            <p className="text-base font-semibold text-[var(--ink)]">No tasks found</p>
            <p className="max-w-xs text-sm text-[var(--ink-muted)]">
              {canCreate
                ? 'No tasks match your current criteria. You can assign a new task using the button above.'
                : 'You have no assigned tasks matching your filters at this time.'}
            </p>
            {canCreate && (
              <Button size="sm" onClick={() => setCreateModalOpen(true)} className="gap-1.5 mt-2">
                <Plus size={14} /> Assign Task
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {tasks.map((task) => {
            const completedChecklistCount = task.checklist?.filter((c) => c.completed).length || 0
            const totalChecklistCount = task.checklist?.length || 0
            const checklistPercentage = totalChecklistCount > 0 ? Math.round((completedChecklistCount / totalChecklistCount) * 100) : 0
            const hasPhone = Boolean((task.assignedTo as any)?.phone)

            return (
              <div
                key={task._id}
                onClick={() => navigate(`${detailBase}/${task._id}`)}
                className="group relative flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs transition-all hover:border-[var(--primary-blue)] hover:shadow-md cursor-pointer sm:flex-row sm:items-center gap-4"
              >
                {/* Left info */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[var(--primary-blue)] bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                      {task.taskCode}
                    </span>
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status as any} />
                    {task.relatedTicket && (
                      <span className="text-[11px] font-semibold text-[var(--ink-muted)] bg-slate-100 px-2 py-0.5 rounded">
                        Ticket: {(task.relatedTicket as any)?.ticketCode || 'Linked'}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[var(--ink)] group-hover:text-[var(--primary-blue)] transition-colors">
                      {task.title}
                    </h3>
                    <p className="text-xs text-[var(--ink-muted)] line-clamp-2 mt-0.5 leading-relaxed">
                      {task.description}
                    </p>
                  </div>

                  {/* Checklist progress bar (if task has checklist) */}
                  {totalChecklistCount > 0 && (
                    <div className="pt-1 max-w-sm">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--ink-muted)] mb-1">
                        <span>Checklist: {completedChecklistCount}/{totalChecklistCount} Subtasks</span>
                        <span>{checklistPercentage}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full transition-all duration-300 ${
                            checklistPercentage === 100
                              ? 'bg-emerald-500'
                              : 'bg-[var(--primary-blue)]'
                          }`}
                          style={{ width: `${checklistPercentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Assignee & Dates Meta */}
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 pt-1 text-xs text-[var(--ink-muted)]">
                    <span className="flex items-center gap-1 font-semibold text-[var(--ink)]">
                      <User size={13} className="text-[var(--primary-blue)]" />
                      {getName(task.assignedTo)}
                    </span>
                    <span>•</span>
                    <span>Dept: {getName(task.department)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar size={13} />
                      Due: {task.dueDate ? format(new Date(task.dueDate), 'dd MMM yyyy, HH:mm') : 'Standard SLA'}
                    </span>
                  </div>
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {canCreate && hasPhone && (
                    <button
                      type="button"
                      onClick={(e) => handleOpenWhatsApp(e, task)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800 transition-colors shadow-2xs"
                      title="Send WhatsApp Task Alert to Assigned Employee"
                    >
                      <MessageCircle size={14} className="text-emerald-600" /> WhatsApp
                    </button>
                  )}

                  <Link
                    to={`${detailBase}/${task._id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] px-3 py-1.5 text-xs font-bold text-[var(--ink)] transition-colors"
                  >
                    View <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            )
          })}

          <div className="mt-4">
            <Pagination
              page={page}
              pages={pages}
              total={total}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(newLimit) => {
                setLimit(newLimit)
                setPage(1)
              }}
            />
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {canCreate && (
        <CreateTaskModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => void load()}
        />
      )}
    </div>
  )
}
