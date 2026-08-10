import type { ReactNode } from 'react'
import { cn, formatLabel } from '../../lib/utils'
import type { TicketPriority, TicketStatus } from '../../types'

const statusStyles: Record<TicketStatus, string> = {
  new: 'bg-slate-100 text-slate-700',
  assigned: 'bg-blue-100 text-blue-800',
  accepted: 'bg-sky-100 text-sky-800',
  in_progress: 'bg-amber-100 text-amber-800',
  resolved: 'bg-teal-100 text-teal-800',
  closed: 'bg-green-100 text-green-800',
  reopened: 'bg-red-100 text-red-800',
}

const priorityStyles: Record<TicketPriority, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-50 text-blue-700',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
}

export function Badge({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize',
        className
      )}
    >
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  return <Badge className={statusStyles[status]}>{formatLabel(status)}</Badge>
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return <Badge className={priorityStyles[priority]}>{priority}</Badge>
}
