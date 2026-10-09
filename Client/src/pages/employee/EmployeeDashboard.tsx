import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Star,
  Ticket,
} from 'lucide-react'
import { dashboardService } from '../../services/dashboardService'
import { KpiCard, PageHeader } from '../../components/common/KpiCard'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { PriorityBadge, StatusBadge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { useToast } from '../../context/ToastContext'
import { useAppSelector } from '../../store/hooks'
import { getErrorMessage } from '../../lib/utils'
import type { EmployeeDashboard } from '../../types'

export function EmployeeDashboard() {
  const toast = useToast()
  const navigate = useNavigate()
  const user = useAppSelector((s) => s.auth.user)
  const [data, setData] = useState<EmployeeDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        setData(await dashboardService.employee())
      } catch (err) {
        toast.error(getErrorMessage(err, 'Failed to load dashboard'))
      } finally {
        setLoading(false)
      }
    })()
  }, [toast])

  if (loading) return <PageLoader />
  if (!data) return null

  const feedbackData = data.feedbacks || {
    avgRating: data.totals.avgRating || 0,
    totalFeedback: data.totals.totalFeedback || 0,
    satisfactionRate: data.totals.satisfactionRate || 0,
    recent: [],
  }

  return (
    <div className="space-y-6">
      {/* Welcome greeting banner */}
      <div className="rounded-2xl bg-gradient-to-br from-[var(--primary-blue-deeper)] via-[var(--primary-blue)] to-[var(--primary-blue-dark)] p-6 text-[var(--white)] shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
            <Sparkles size={14} className="text-[var(--gold)]" />
            <span>Employee Operations Hub</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Welcome back, {user?.name ?? 'Staff Member'} 👋
          </h1>
          <p className="mt-1 text-xs text-white/70">
            Track your assigned work orders, tasks, and real-time customer satisfaction feedback.
          </p>
        </div>

        {feedbackData.totalFeedback > 0 && (
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15 shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--gold)] text-[var(--primary-blue-deeper)] font-black text-base shadow-xs">
              ★
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black text-white">{feedbackData.avgRating}</span>
                <span className="text-xs text-white/60">/ 5.0</span>
                <span className="ml-1 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-400/30">
                  {feedbackData.satisfactionRate}% CSAT
                </span>
              </div>
              <p className="text-[11px] text-white/60">
                Based on {feedbackData.totalFeedback} customer reviews
              </p>
            </div>
          </div>
        )}
      </div>

      <PageHeader
        title="My Work & Performance"
        description="Your assigned ticket queue, completion velocity, and customer ratings."
        actions={
          <div className="flex items-center gap-2">
            <Link to="/employee/tickets">
              <Button size="sm" variant="primary">My Tickets</Button>
            </Link>
            <Link to="/employee/tasks">
              <Button size="sm" variant="outline">My Tasks</Button>
            </Link>
          </div>
        }
      />

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Open Tickets" value={data.totals.open} icon={Ticket} accent="blue" />
        <KpiCard label="Overdue SLA" value={data.totals.overdue} icon={AlertTriangle} accent="danger" />
        <KpiCard label="Resolved" value={data.totals.resolved} icon={CheckCircle2} accent="success" />
        <div className="rounded-xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[var(--ink-muted)]">CSAT Rating</p>
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
              {feedbackData.totalFeedback} feedbacks received
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-500 border border-amber-200">
            <Star size={22} className="fill-amber-400 text-amber-400" />
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Status breakdown */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs lg:col-span-4 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-[var(--ink)] mb-1">Queue Status Breakdown</h2>
            <p className="text-xs text-[var(--ink-muted)] mb-4">Tickets currently in your queue</p>
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
                  No assigned tickets yet.
                </li>
              )}
            </ul>
          </div>

          <div className="mt-4 pt-4 border-t border-[var(--border)] flex justify-between items-center text-xs text-[var(--ink-muted)]">
            <span>Active Assignments:</span>
            <span className="font-bold text-[var(--primary-blue)]">{data.totals.open} tickets</span>
          </div>
        </div>

        {/* Recent assignments */}
        <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--white)] shadow-xs lg:col-span-8 flex flex-col">
          <div className="border-b border-[var(--border)] px-5 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--ink)]">Recent Ticket Assignments</h2>
              <p className="text-xs text-[var(--ink-muted)]">Latest work orders dispatched to you</p>
            </div>
            <Link
              to="/employee/tickets"
              className="text-xs font-bold text-[var(--primary-blue)] hover:underline flex items-center gap-1"
            >
              View all <ExternalLink size={12} />
            </Link>
          </div>
          <div className="flex-1">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-[var(--primary-blue)] text-white/90 text-xs font-bold uppercase tracking-wider">
                  <th className="px-4 py-3 first:rounded-tl-lg">Requester &amp; Code</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Title / Issue</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3 last:rounded-tr-lg">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {data.recent.map((t) => (
                  <tr
                    key={t._id}
                    onClick={() => navigate(`/employee/tickets/${t._id}`)}
                    className="cursor-pointer transition-colors hover:bg-[var(--primary-blue-light)]"
                  >
                    <td className="px-4 py-3">
                      <p className="font-bold text-[var(--ink)] text-xs">
                        {t.requester?.name || 'Valued User'}
                      </p>
                      <Link
                        to={`/employee/tickets/${t._id}`}
                        className="font-mono text-xs font-bold text-[var(--primary-blue)] hover:underline block mt-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {t.ticketCode}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-[var(--ink)]">
                      {t.complaintType}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--ink)] max-w-[180px] truncate">
                      {t.title ? (
                        <span className="font-semibold">{t.title}</span>
                      ) : (
                        <span className="text-[var(--ink-muted)] italic">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                  </tr>
                ))}
                {!data.recent.length && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-[var(--ink-muted)]">
                      No recent assignments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Customer Feedbacks Received Section ─────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--border)] gap-2">
          <div>
            <h2 className="text-base font-bold text-[var(--ink)] flex items-center gap-2">
              <Star size={18} className="fill-amber-400 text-amber-500" />
              Customer Feedback &amp; Ratings Received
            </h2>
            <p className="text-xs text-[var(--ink-muted)]">
              Direct ratings, reviews, and satisfaction scores given by requesters for your resolved tickets.
            </p>
          </div>
          {feedbackData.totalFeedback > 0 && (
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-200 flex items-center gap-1">
                ⭐ {feedbackData.avgRating} / 5.0 Average Score
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
                  onClick={() => navigate(`/employee/tickets/${item._id}`)}
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
                        {item.complaintType} {item.title ? `— ${item.title}` : ''}
                      </p>
                    </div>

                    {/* Star Badge */}
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg border border-amber-200 shrink-0 font-bold text-xs">
                      <span>{item.feedback?.rating}</span>
                      <Star size={12} className="fill-amber-400 text-amber-500" />
                    </div>
                  </div>

                  {/* Comment */}
                  {item.feedback?.comment ? (
                    <div className="mt-2.5 rounded-lg bg-white p-2.5 border border-slate-100 text-xs text-[var(--ink)] italic leading-relaxed">
                      "{item.feedback.comment}"
                    </div>
                  ) : (
                    <p className="mt-2 text-[11px] text-[var(--ink-muted)] italic">
                      No written feedback comment provided.
                    </p>
                  )}

                  {/* Timestamp */}
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
              <p className="text-xs font-bold text-[var(--ink)]">No feedback received yet</p>
              <p className="text-[11px] text-[var(--ink-muted)] mt-0.5 max-w-sm">
                When customers submit star ratings and feedback for your resolved tickets, they will automatically appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
