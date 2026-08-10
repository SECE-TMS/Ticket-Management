import { PRIORITIES, STATUSES, formatLabel } from '../../lib/utils'
import type { TicketPriority, TicketStatus } from '../../types'

interface TicketFiltersProps {
  search: string
  status: TicketStatus | ''
  priority: TicketPriority | ''
  onSearchChange: (v: string) => void
  onStatusChange: (v: TicketStatus | '') => void
  onPriorityChange: (v: TicketPriority | '') => void
  extra?: React.ReactNode
}

export function TicketFilters({
  search,
  status,
  priority,
  onSearchChange,
  onStatusChange,
  onPriorityChange,
  extra,
}: TicketFiltersProps) {
  return (
    <div className="panel mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="block text-sm">
        <span className="mb-1 block text-slate-600">Search</span>
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Code, name, mobile…"
          className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-accent"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-slate-600">Status</span>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value as TicketStatus | '')}
          className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-accent"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {formatLabel(s)}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-slate-600">Priority</span>
        <select
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value as TicketPriority | '')}
          className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-accent"
        >
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {formatLabel(p)}
            </option>
          ))}
        </select>
      </label>
      {extra}
    </div>
  )
}
