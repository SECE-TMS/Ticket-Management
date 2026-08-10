import { Search } from 'lucide-react'
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
    <div
      className="mb-5 grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--white)] p-4 shadow-xs sm:grid-cols-2 lg:grid-cols-4"
      id="ticket-filters"
    >
      {/* Search with icon */}
      <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
        <label htmlFor="tf-search" className="text-sm font-semibold text-[var(--ink)]">
          Search
        </label>
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--ink-muted)]"
          />
          <input
            id="tf-search"
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Code, name, mobile…"
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--white)] pl-9 pr-3 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
          />
        </div>
      </div>

      {/* Status */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="tf-status" className="text-sm font-semibold text-[var(--ink)]">
          Status
        </label>
        <select
          id="tf-status"
          value={status}
          onChange={(e) => onStatusChange(e.target.value as TicketStatus | '')}
          className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--white)] px-3 text-sm text-[var(--ink)] outline-none cursor-pointer transition-colors focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {formatLabel(s)}
            </option>
          ))}
        </select>
      </div>

      {/* Priority */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="tf-priority" className="text-sm font-semibold text-[var(--ink)]">
          Priority
        </label>
        <select
          id="tf-priority"
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value as TicketPriority | '')}
          className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--white)] px-3 text-sm text-[var(--ink)] outline-none cursor-pointer transition-colors focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
        >
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {formatLabel(p)}
            </option>
          ))}
        </select>
      </div>

      {extra && <div className="flex flex-col gap-1.5">{extra}</div>}
    </div>
  )
}
