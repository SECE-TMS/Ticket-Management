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
      className="panel mb-5 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4"
      id="ticket-filters"
    >
      {/* Search with icon */}
      <div className="form-field sm:col-span-2 lg:col-span-1">
        <label htmlFor="tf-search" className="form-label">
          Search
        </label>
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
            style={{ color: 'var(--ink-muted)' }}
          />
          <input
            id="tf-search"
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Code, name, mobile…"
            className="input-field"
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>
      </div>

      {/* Status */}
      <div className="form-field">
        <label htmlFor="tf-status" className="form-label">
          Status
        </label>
        <select
          id="tf-status"
          value={status}
          onChange={(e) => onStatusChange(e.target.value as TicketStatus | '')}
          className="input-field"
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
      <div className="form-field">
        <label htmlFor="tf-priority" className="form-label">
          Priority
        </label>
        <select
          id="tf-priority"
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value as TicketPriority | '')}
          className="input-field"
        >
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {formatLabel(p)}
            </option>
          ))}
        </select>
      </div>

      {extra && <div className="form-field">{extra}</div>}
    </div>
  )
}
