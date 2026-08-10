import { Link } from 'react-router-dom'
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
  if (!tickets.length) {
    return (
      <div className="panel">
        <div className="empty-state">
          <div className="empty-state-icon">
            <Inbox size={24} />
          </div>
          <p className="empty-state-title">No tickets found</p>
          <p className="empty-state-desc">
            No tickets match your current filters. Try adjusting your search or clearing the filters.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="panel overflow-x-auto">
      <table className="data-table" id="tickets-table">
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Requester</th>
            <th>Department</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Assignee</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t._id}>
              <td>
                <Link
                  to={`${detailBase}/${t._id}`}
                  className="font-semibold hover:underline"
                  style={{ color: 'var(--primary-blue)' }}
                >
                  {t.ticketCode}
                </Link>
                <p
                  className="mt-0.5 max-w-[14rem] truncate text-xs"
                  style={{ color: 'var(--ink-muted)' }}
                >
                  {t.complaintType}
                </p>
              </td>
              <td>
                <p className="font-medium" style={{ color: 'var(--ink)' }}>
                  {t.requester.name}
                </p>
                <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                  {t.requester.mobile}
                </p>
              </td>
              <td style={{ color: 'var(--ink-muted)' }}>{getName(t.department)}</td>
              <td>
                <StatusBadge status={t.status} />
              </td>
              <td>
                <PriorityBadge priority={t.priority} />
              </td>
              <td style={{ color: 'var(--ink-muted)' }}>
                {getName(t.assignedTo, 'Unassigned')}
              </td>
              <td
                className="whitespace-nowrap text-xs"
                style={{ color: 'var(--ink-muted)' }}
              >
                {format(new Date(t.createdAt), 'dd MMM yyyy')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
