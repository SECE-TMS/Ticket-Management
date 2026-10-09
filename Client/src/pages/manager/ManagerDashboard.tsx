import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ExternalLink,
  MessageSquare,
  Plus,
  Star,
  Ticket,
  UserRound,
  Users,
} from 'lucide-react'
import { dashboardService } from '../../services/dashboardService'
import { KpiCard, PageHeader } from '../../components/common/KpiCard'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { StatusBadge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { CreateTaskModal } from '../../components/tasks/CreateTaskModal'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../lib/utils'
import type { ManagerDashboard as IManagerDashboard } from '../../types'
import { getName } from '../../types'

export function ManagerDashboard() {
  const toast = useToast()
  const navigate = useNavigate()
  const [data, setData] = useState<IManagerDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [createTaskOpen, setCreateTaskOpen] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        setData(await dashboardService.manager())
      } catch (err) {
        toast.error(getErrorMessage(err, 'Failed to load dashboard'))
      } finally {
        setLoading(false)
      }
    })()
  }, [toast])

  if (loading) return <PageLoader />
  if (!data) return null

  const maxOpen = Math.max(...data.workload.map((w) => w.openCount), 1)
  const feedbackData = data.feedbacks || {
    avgRating: data.totals.avgRating || 0,
    totalFeedback: data.totals.totalFeedback || 0,
    satisfactionRate: data.totals.satisfactionRate || 0,
    recent: [],
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manager Dashboard"
        description="Department workload, unassigned requests, team capacity, and customer satisfaction."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={() => setCreateTaskOpen(true)}
              className="gap-1.5 font-bold shadow-xs cursor-pointer"
            >
              <Plus size={14} /> Assign Specific Task
            </Button>
            <Link to="/manager/tickets">
              <Button size="sm" variant="primary">View Tickets</Button>
            </Link>
            <Link to="/manager/tasks">
              <Button size="sm" variant="outline">View Tasks</Button>
            </Link>
          </div>
        }
      />

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Open Tickets" value={data.totals.open} icon={Ticket} accent="blue" />
        <KpiCard label="Unassigned" value={data.totals.unassigned} icon={UserRound} accent="gold" />
        <KpiCard label="Overdue SLA" value={data.totals.overdue} icon={AlertTriangle} accent="danger" />
        <KpiCard label="Active Staff" value={data.totals.employees} icon={Users} accent="success" />
        
        {/* Department CSAT Card */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[var(--ink-muted)]">Dept CSAT Rating</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-[var(--ink)]">
                {feedbackData.avgRating > 0 ? `${feedbackData.avgRating}★` : '—'}
              </span>
              {feedbackData.totalFeedback > 0 && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  {feedbackData.satisfactionRate}%
                </span>
              )}
            </div>
            <p className="text-[11px] text-[var(--ink-muted)] mt-1">
              {feedbackData.totalFeedback} reviews recorded
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-500 border border-amber-200">
            <Star size={22} className="fill-amber-400 text-amber-400" />
          </div>
        </div>
      </div>

      {/* Workload + Status row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Team workload with progress bars */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs">
          <h2 className="text-base font-bold text-[var(--ink)] mb-4">Team Workload Distribution</h2>
          {data.workload.length ? (
            <ul className="space-y-4">
              {data.workload.map((w) => (
                <li key={w.employeeId}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-semibold text-[var(--ink)]">
                      {w.name}
                    </span>
                    <span className="font-bold tabular-nums text-[var(--primary-blue)]">
                      {w.openCount} open
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        w.openCount === maxOpen
                          ? 'bg-[var(--danger)]'
                          : 'bg-[var(--primary-blue)]'
                      }`}
                      style={{ width: `${Math.round((w.openCount / maxOpen) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[var(--ink-muted)] py-4 text-center">
              No open assigned work yet.
            </p>
          )}
        </div>

        {/* Status breakdown */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs">
          <h2 className="text-base font-bold text-[var(--ink)] mb-4">Department Status Summary</h2>
          <ul className="space-y-3">
            {Object.entries(data.byStatus).map(([status, count]) => (
              <li key={status} className="flex items-center justify-between text-sm py-1 border-b border-slate-50 last:border-0">
                <StatusBadge status={status as never} />
                <span className="font-bold tabular-nums text-[var(--ink)] bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-100 text-xs">
                  {count}
                </span>
              </li>
            ))}
            {!Object.keys(data.byStatus).length && (
              <li className="text-xs text-[var(--ink-muted)] py-4 text-center">
                No tickets recorded yet.
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* ── Customer Feedbacks Received for Department ──────────────────────── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--border)] gap-2">
          <div>
            <h2 className="text-base font-bold text-[var(--ink)] flex items-center gap-2">
              <Star size={18} className="fill-amber-400 text-amber-500" />
              Department Customer Feedback &amp; Reviews
            </h2>
            <p className="text-xs text-[var(--ink-muted)]">
              Real ratings and comments left by users after resolution of department tickets.
            </p>
          </div>
          {feedbackData.totalFeedback > 0 && (
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-200">
                ⭐ {feedbackData.avgRating} / 5.0 Average
              </span>
            </div>
          )}
        </div>

        <div className="mt-4">
          {feedbackData.recent && feedbackData.recent.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {feedbackData.recent.map((item) => (
                <div
                  key={item._id}
                  onClick={() => navigate(`/manager/tickets/${item._id}`)}
                  className="rounded-xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] to-white p-4 transition-all hover:border-[var(--primary-blue)] hover:shadow-sm cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-[var(--primary-blue)] group-hover:underline">
                          {item.ticketCode}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-semibold text-[var(--ink)]">
                          {item.requester?.name || 'Requester'}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                        Handled by: <span className="font-semibold text-slate-700">{getName(item.assignedTo, 'Unassigned')}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg border border-amber-200 shrink-0 font-bold text-xs">
                      <span>{item.feedback?.rating}</span>
                      <Star size={12} className="fill-amber-400 text-amber-500" />
                    </div>
                  </div>

                  {item.feedback?.comment ? (
                    <div className="mt-2.5 rounded-lg bg-white p-2.5 border border-slate-100 text-xs text-[var(--ink)] italic leading-relaxed">
                      "{item.feedback.comment}"
                    </div>
                  ) : (
                    <p className="mt-2 text-[11px] text-[var(--ink-muted)] italic">
                      No written feedback comment provided.
                    </p>
                  )}

                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      {item.feedback?.submittedAt
                        ? new Date(item.feedback.submittedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Recently submitted'}
                    </span>
                    <span className="text-[var(--primary-blue)] font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      View Ticket <ExternalLink size={10} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-400 mb-2 border border-amber-100">
                <MessageSquare size={22} />
              </div>
              <p className="text-xs font-bold text-[var(--ink)]">No customer feedback logged yet</p>
              <p className="text-[11px] text-[var(--ink-muted)] mt-0.5 max-w-sm">
                Feedback and star ratings submitted by users for your department will appear here automatically.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent tickets */}
      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--white)] shadow-xs">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 className="text-base font-bold text-[var(--ink)]">Recent Department Tickets</h2>
          <Link
            to="/manager/tickets"
            className="text-xs font-bold text-[var(--primary-blue)] hover:underline flex items-center gap-1"
          >
            View all tickets <ExternalLink size={12} />
          </Link>
        </div>
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-[var(--primary-blue)] text-white/90 text-xs font-bold uppercase tracking-wider">
              <th className="px-5 py-3 first:rounded-tl-lg">Requester &amp; Ticket ID</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 last:rounded-tr-lg">Assignee</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {data.recent.map((t) => (
              <tr
                key={t._id}
                onClick={() => navigate(`/manager/tickets/${t._id}`)}
                className="cursor-pointer transition-colors hover:bg-[var(--primary-blue-light)]"
              >
                <td className="px-5 py-3.5">
                  <div className="font-bold text-[var(--ink)] text-xs">
                    {t.requester?.name || 'Valued User'}
                  </div>
                  <Link
                    to={`/manager/tickets/${t._id}`}
                    className="font-mono text-xs font-bold text-[var(--primary-blue)] hover:underline block mt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t.ticketCode}
                  </Link>
                </td>
                <td className="px-5 py-3.5 text-xs font-medium text-[var(--ink)]">
                  {t.complaintType}
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={t.status} />
                </td>
                <td className="px-5 py-3.5 text-xs text-[var(--ink-muted)]">
                  {getName(t.assignedTo, 'Unassigned')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CreateTaskModal
        open={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        onSuccess={() => toast.success('Task created, assigned, and notification dispatched!')}
      />
    </div>
  )
}
