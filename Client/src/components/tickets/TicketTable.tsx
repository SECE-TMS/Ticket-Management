import { Link, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ChevronRight, Inbox, User } from 'lucide-react'
import type { Ticket } from '../../types'
import { getName } from '../../types'
import { PriorityBadge, StatusBadge } from '../common/Badge'

interface TicketTableProps {
  tickets: Ticket[]
  detailBase: string
}

export function TicketTable({ tickets, detailBase }: TicketTableProps) {
  const navigate = useNavigate()

  if (!tickets.length) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] shadow-xs">
        <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center gap-3">
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
    <div className="w-full">
      {/* ── Mobile Card View (Visible on < md screens) ───────────────────────── */}
      <div className="flex flex-col gap-3 md:hidden" id="tickets-mobile-cards">
        {tickets.map((t) => (
          <div
            key={t._id}
            onClick={() => navigate(`${detailBase}/${t._id}`)}
            className="group relative rounded-2xl border border-[var(--border)] bg-[var(--white)] p-4 shadow-xs hover:border-[var(--primary-blue-muted)] hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
          >
            {/* Top row: Code + Status Badge */}
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold text-[var(--primary-blue)]">
                {t.ticketCode}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <StatusBadge status={t.status} />
                <PriorityBadge priority={t.priority} />
              </div>
            </div>

            {/* Middle: Complaint & Requester */}
            <div className="mt-2.5">
              <h3 className="text-sm font-bold text-[var(--ink)] leading-snug">
                {t.complaintType}
              </h3>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--ink-muted)]">
                <User size={13} className="shrink-0 text-[var(--primary-blue)]" />
                <span className="font-semibold text-[var(--ink)] truncate">
                  {t.requester?.name || 'Valued User'}
                </span>
                {t.requester?.rollNumber && (
                  <span className="rounded bg-[var(--surface-2)] px-1.5 py-0.2 text-[10px] font-bold text-[var(--ink-muted)]">
                    {t.requester.rollNumber}
                  </span>
                )}
              </div>
            </div>

            {/* Bottom row: Department, Date, Assignee & Arrow */}
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-[var(--ink-muted)]">
              <div className="flex items-center gap-2 truncate">
                <span className="font-medium text-[var(--ink-muted)] truncate">
                  {getName(t.department)}
                </span>
                <span>•</span>
                <span className="shrink-0">{format(new Date(t.createdAt), 'dd MMM yyyy')}</span>
              </div>
              <div className="flex items-center gap-1 text-[var(--primary-blue)] font-bold shrink-0 ml-2">
                <span className="text-[11px] truncate max-w-[90px]">
                  {getName(t.assignedTo, 'Unassigned')}
                </span>
                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Desktop Data Table (Visible on ≥ md screens) ────────────────────── */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--white)] shadow-xs">
        <table className="w-full text-left text-sm border-collapse" id="tickets-table">
          <thead>
            <tr className="bg-[var(--primary-blue)] text-white/90 text-xs font-bold uppercase tracking-wider">
              <th className="px-4 py-3 first:rounded-tl-2xl">Requester &amp; Ticket ID</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Complaint</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Assignee</th>
              <th className="px-4 py-3 last:rounded-tr-2xl">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {tickets.map((t) => (
              <tr
                key={t._id}
                onClick={() => navigate(`${detailBase}/${t._id}`)}
                className="cursor-pointer transition-colors hover:bg-[var(--primary-blue-light)]"
              >
                <td className="px-4 py-3.5">
                  <p className="font-bold text-[var(--ink)]">
                    {t.requester?.name || 'Valued User'}
                    {t.requester?.rollNumber && (
                      <span className="ml-1.5 inline-block rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--ink-muted)]">
                        {t.requester.rollNumber}
                      </span>
                    )}
                  </p>
                  <Link
                    to={`${detailBase}/${t._id}`}
                    className="font-mono text-xs font-bold text-[var(--primary-blue)] hover:underline block mt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t.ticketCode}
                  </Link>
                </td>
                <td className="px-4 py-3.5 text-[var(--ink-muted)]">{getName(t.department)}</td>
                <td className="px-4 py-3.5 font-medium text-[var(--ink)]">
                  {t.complaintType}
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={t.status} />
                </td>
                <td className="px-4 py-3.5">
                  <PriorityBadge priority={t.priority} />
                </td>
                <td className="px-4 py-3.5 text-[var(--ink-muted)]">
                  {getName(t.assignedTo, 'Unassigned')}
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap text-xs text-[var(--ink-muted)]">
                  {format(new Date(t.createdAt), 'dd MMM yyyy')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

