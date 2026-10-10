import { Link, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { Clock, Inbox } from 'lucide-react'
import { useAppSelector } from '../../store/hooks'
import type { Ticket } from '../../types'
import { getName } from '../../types'
import { PriorityBadge, StatusBadge } from '../common/Badge'

interface TicketTableProps {
  tickets: Ticket[]
  detailBase: string
}

function formatSubmissionDuration(dateStr: string | Date): string {
  if (!dateStr) return '—'
  const now = Date.now()
  const created = new Date(dateStr).getTime()
  const diffMs = Math.max(0, now - created)
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''}`
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''}`
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''}`
  const diffMonths = Math.floor(diffDays / 30)
  return `${diffMonths} mo${diffMonths > 1 ? 's' : ''}`
}

export function TicketTable({ tickets, detailBase }: TicketTableProps) {
  const navigate = useNavigate()
  const user = useAppSelector((s) => s.auth.user)
  const role = user?.role
  const showDepartment = role === 'admin' || role === 'superadmin'
  const showAssignee = role !== 'employee'

  if (!tickets.length) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--white)] shadow-xs">
        <div className="flex flex-col items-center justify-center p-12 text-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary-blue-light)] text-[var(--primary-blue)]">
            <Inbox size={24} />
          </div>
          <p className="text-base font-semibold text-[var(--ink)]">No tickets found</p>
          <p className="max-w-xs text-sm text-[var(--ink-muted)]">
            No tickets match your current filters. Try adjusting your search or clearing the filters.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--white)] shadow-xs">
      <table className="w-full text-left text-sm border-collapse" id="tickets-table">
        <thead>
          <tr className="bg-[var(--primary-blue)] text-white/90 text-xs font-bold uppercase tracking-wider">
            <th className="px-4 py-3 first:rounded-tl-xl">Requester &amp; Ticket ID</th>
            {showDepartment && <th className="px-4 py-3">Department</th>}
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Ticket Title</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Duration</th>
            {showAssignee && <th className="px-4 py-3">Assignee</th>}
            <th className="px-4 py-3 last:rounded-tr-xl">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {tickets.map((t) => {
            const reqDept = t.requester?.department || (t as any).requesterDepartment
            return (
              <tr
                key={t._id}
                onClick={() => navigate(`${detailBase}/${t._id}`)}
                className="cursor-pointer transition-colors hover:bg-[var(--primary-blue-light)]"
              >
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-[var(--ink)]">
                      {t.requester?.name || 'Valued User'}
                    </span>
                    {t.requester?.rollNumber && (
                      <span className="inline-block rounded bg-[var(--surface-2)] border border-[var(--border)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--ink-muted)]">
                        {t.requester.rollNumber}
                      </span>
                    )}
                    {reqDept && (
                      <span className="inline-block rounded bg-blue-50 border border-blue-200/80 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                        {reqDept}
                      </span>
                    )}
                  </div>
                  <Link
                    to={`${detailBase}/${t._id}`}
                    className="font-mono text-xs font-bold text-[var(--primary-blue)] hover:underline block mt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t.ticketCode}
                  </Link>
                </td>
                {showDepartment && (
                  <td className="px-4 py-3.5 text-[var(--ink-muted)]">{getName(t.department)}</td>
                )}
                <td className="px-4 py-3.5 font-medium text-[var(--ink)]">
                  {t.complaintType}
                </td>
                <td className="px-4 py-3.5 text-[var(--ink)] max-w-[200px]">
                  {t.title ? (
                    <span className="font-semibold">{t.title}</span>
                  ) : (
                    <span className="text-[var(--ink-muted)] italic">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={t.status} />
                </td>
                <td className="px-4 py-3.5">
                  <PriorityBadge priority={t.priority} />
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200/80 px-2 py-0.5 text-xs font-semibold text-slate-700">
                    <Clock size={11} className="text-slate-500" />
                    {formatSubmissionDuration(t.createdAt)}
                  </span>
                </td>
                {showAssignee && (
                  <td className="px-4 py-3.5 text-[var(--ink-muted)]">
                    {getName(t.assignedTo, 'Unassigned')}
                  </td>
                )}
                <td className="px-4 py-3.5 whitespace-nowrap text-xs text-[var(--ink-muted)]">
                  {format(new Date(t.createdAt), 'dd MMM yyyy')}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
