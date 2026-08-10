import { Link, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { Inbox } from 'lucide-react'
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
            <th className="px-4 py-3 first:rounded-tl-xl">Ticket</th>
            <th className="px-4 py-3">Requester</th>
            <th className="px-4 py-3">Department</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Assignee</th>
            <th className="px-4 py-3 last:rounded-tr-xl">Created</th>
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
                <Link
                  to={`${detailBase}/${t._id}`}
                  className="font-bold text-[var(--primary-blue)] hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {t.ticketCode}
                </Link>
                <p className="mt-0.5 max-w-[14rem] truncate text-xs text-[var(--ink-muted)]">
                  {t.complaintType}
                </p>
              </td>
              <td className="px-4 py-3.5">
                <p className="font-semibold text-[var(--ink)]">{t.requester.name}</p>
                <p className="text-xs text-[var(--ink-muted)]">{t.requester.mobile}</p>
              </td>
              <td className="px-4 py-3.5 text-[var(--ink-muted)]">{getName(t.department)}</td>
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
  )
}
