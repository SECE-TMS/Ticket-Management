import type { ReactNode } from 'react'
import { cn, formatLabel } from '../../lib/utils'
import type { TicketPriority, TicketStatus } from '../../types'

const statusStyles: Record<TicketStatus, string> = {
  new: 'bg-[var(--primary-blue-light)] text-[var(--primary-blue)]',
  assigned: 'bg-blue-100 text-blue-800',
  accepted: 'bg-sky-100 text-sky-800',
  in_progress: 'bg-[var(--gold-light)] text-[var(--gold-dark)]',
  resolved: 'bg-[var(--success-light)] text-[var(--success)]',
  closed: 'bg-slate-100 text-slate-700',
  reopened: 'bg-[var(--danger-light)] text-[var(--danger)]',
}

const priorityStyles: Record<TicketPriority, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-[var(--primary-blue-light)] text-[var(--primary-blue)]',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-[var(--danger-light)] text-[var(--danger)]',
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
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize whitespace-nowrap',
        className
      )}
    >
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Badge className={statusStyles[status]}>
      <span className="h-1.5 w-1.5 rounded-full bg-current shrink-0" aria-hidden />
      {formatLabel(status)}
    </Badge>
  )
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <Badge className={priorityStyles[priority]}>
      <span className="h-1.5 w-1.5 rounded-full bg-current shrink-0" aria-hidden />
      {formatLabel(priority)}
    </Badge>
  )
}
