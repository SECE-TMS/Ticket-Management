import type { ReactNode } from 'react'
import { cn, formatLabel } from '../../lib/utils'
import type { TicketPriority, TicketStatus } from '../../types'

const statusClasses: Record<TicketStatus, string> = {
  new:         'status-new',
  assigned:    'status-assigned',
  accepted:    'status-accepted',
  in_progress: 'status-in_progress',
  resolved:    'status-resolved',
  closed:      'status-closed',
  reopened:    'status-reopened',
}

const priorityClasses: Record<TicketPriority, string> = {
  low:    'priority-low',
  medium: 'priority-medium',
  high:   'priority-high',
  urgent: 'priority-urgent',
}

export function Badge({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span className={cn('badge', className)}>
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={cn('badge', statusClasses[status])}>
      <span className="badge-dot" style={{ background: 'currentColor' }} aria-hidden />
      {formatLabel(status)}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span className={cn('badge', priorityClasses[priority])}>
      <span className="badge-dot" style={{ background: 'currentColor' }} aria-hidden />
      {formatLabel(priority)}
    </span>
  )
}
