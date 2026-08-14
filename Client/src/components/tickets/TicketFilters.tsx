import { Download, Search } from 'lucide-react'
import { PRIORITIES, STATUSES, formatLabel } from '../../lib/utils'
import type { Department, TicketPriority, TicketStatus } from '../../types'
import { Button } from '../common/Button'

interface TicketFiltersProps {
  search: string
  status: TicketStatus | ''
  priority: TicketPriority | ''
  department?: string
  fromDate?: string
  toDate?: string
  departments?: Department[]
  onSearchChange: (v: string) => void
  onStatusChange: (v: TicketStatus | '') => void
  onPriorityChange: (v: TicketPriority | '') => void
  onDepartmentChange?: (v: string) => void
  onFromDateChange?: (v: string) => void
  onToDateChange?: (v: string) => void
  onExportExcel?: () => void
  exporting?: boolean
  extra?: React.ReactNode
}

export function TicketFilters({
  search,
  status,
  priority,
  department = '',
  fromDate = '',
  toDate = '',
  departments = [],
  onSearchChange,
  onStatusChange,
  onPriorityChange,
  onDepartmentChange,
  onFromDateChange,
  onToDateChange,
  onExportExcel,
  exporting = false,
  extra,
}: TicketFiltersProps) {
  return (
    <div
      className="mb-5 grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--white)] p-4 shadow-xs sm:grid-cols-2 lg:grid-cols-6"
      id="ticket-filters"
    >
      {/* Search */}
      <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-2">
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
            placeholder="Code, name, mobile, roll number…"
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--white)] pl-9 pr-3 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
          />
        </div>
      </div>

      {/* Department Filter (if provided) */}
      {onDepartmentChange && (
        <div className="flex flex-col gap-1.5 lg:col-span-1">
          <label htmlFor="tf-department" className="text-sm font-semibold text-[var(--ink)]">
            Department
          </label>
          <select
            id="tf-department"
            value={department}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--white)] px-3 text-sm text-[var(--ink)] outline-none cursor-pointer transition-colors focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Status */}
      <div className="flex flex-col gap-1.5 lg:col-span-1">
        <label htmlFor="tf-status" className="text-sm font-semibold text-[var(--ink)]">
          Status
        </label>
        <select
          id="tf-status"
          value={status}
          onChange={(e) => onStatusChange(e.target.value as TicketStatus | '')}
          className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--white)] px-3 text-sm text-[var(--ink)] outline-none cursor-pointer transition-colors focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {formatLabel(s)}
            </option>
          ))}
        </select>
      </div>

      {/* Priority */}
      <div className="flex flex-col gap-1.5 lg:col-span-1">
        <label htmlFor="tf-priority" className="text-sm font-semibold text-[var(--ink)]">
          Priority
        </label>
        <select
          id="tf-priority"
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value as TicketPriority | '')}
          className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--white)] px-3 text-sm text-[var(--ink)] outline-none cursor-pointer transition-colors focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
        >
          <option value="">All Priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {formatLabel(p)}
            </option>
          ))}
        </select>
      </div>

      {/* Date Range - From */}
      {onFromDateChange && (
        <div className="flex flex-col gap-1.5 lg:col-span-1">
          <label htmlFor="tf-from" className="text-sm font-semibold text-[var(--ink)]">
            From Date
          </label>
          <input
            id="tf-from"
            type="date"
            value={fromDate}
            onChange={(e) => onFromDateChange(e.target.value)}
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--white)] px-3 text-sm text-[var(--ink)] outline-none cursor-pointer transition-colors focus:border-[var(--primary-blue)]"
          />
        </div>
      )}

      {/* Date Range - To */}
      {onToDateChange && (
        <div className="flex flex-col gap-1.5 lg:col-span-1">
          <label htmlFor="tf-to" className="text-sm font-semibold text-[var(--ink)]">
            To Date
          </label>
          <input
            id="tf-to"
            type="date"
            value={toDate}
            onChange={(e) => onToDateChange(e.target.value)}
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--white)] px-3 text-sm text-[var(--ink)] outline-none cursor-pointer transition-colors focus:border-[var(--primary-blue)]"
          />
        </div>
      )}

      {/* Excel Download Button */}
      {onExportExcel && (
        <div className="flex flex-col justify-end lg:col-span-1">
          <Button
            type="button"
            onClick={onExportExcel}
            loading={exporting}
            variant="secondary"
            className="h-10 w-full font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs border-0"
          >
            <Download size={15} className="mr-1.5" />
            Excel Report
          </Button>
        </div>
      )}

      {extra && <div className="flex flex-col gap-1.5">{extra}</div>}
    </div>
  )
}
