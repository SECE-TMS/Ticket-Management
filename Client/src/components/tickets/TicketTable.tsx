import { Link } from 'react-router-dom'
import { format } from 'date-fns'
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
      <div className="panel px-4 py-12 text-center text-sm text-slate-500">
        No tickets match your filters.
      </div>
    )
  }

  return (
    <div className="panel overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-100 bg-slate-50/80 text-xs tracking-wide text-slate-500 uppercase">
          <tr>
            <th className="px-4 py-3 font-medium">Ticket</th>
            <th className="px-4 py-3 font-medium">Requester</th>
            <th className="px-4 py-3 font-medium">Department</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Priority</th>
            <th className="px-4 py-3 font-medium">Assignee</th>
            <th className="px-4 py-3 font-medium">Created</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t._id} className="border-b border-slate-50 hover:bg-slate-50/60">
              <td className="px-4 py-3">
                <Link
                  to={`${detailBase}/${t._id}`}
                  className="font-medium text-accent hover:underline"
                >
                  {t.ticketCode}
                </Link>
                <p className="mt-0.5 max-w-[14rem] truncate text-xs text-slate-500">
                  {t.complaintType}
                </p>
              </td>
              <td className="px-4 py-3">
                <p>{t.requester.name}</p>
                <p className="text-xs text-slate-500">{t.requester.mobile}</p>
              </td>
              <td className="px-4 py-3">{getName(t.department)}</td>
              <td className="px-4 py-3">
                <StatusBadge status={t.status} />
              </td>
              <td className="px-4 py-3">
                <PriorityBadge priority={t.priority} />
              </td>
              <td className="px-4 py-3">{getName(t.assignedTo, 'Unassigned')}</td>
              <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                {format(new Date(t.createdAt), 'dd MMM yyyy')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
