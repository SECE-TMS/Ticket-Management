import { Download, FileSpreadsheet, RotateCcw, Search, X } from 'lucide-react'
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
  onExportCsv?: () => void
  exporting?: boolean | 'excel' | 'csv' | null
  filteredCount?: number
  hasActiveFilters?: boolean
  onResetFilters?: () => void
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
  onExportCsv,
  exporting = false,
  filteredCount,
  hasActiveFilters = false,
  onResetFilters,
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
          <option value="">All Status</option>
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

      {/* Export & Reset Actions */}
      <div className="flex flex-wrap items-end gap-2 lg:col-span-2">
        {onExportExcel && (
          <Button
            type="button"
            onClick={onExportExcel}
            loading={exporting === true || exporting === 'excel'}
            variant="secondary"
            className="h-10 flex-1 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs border-0 text-xs sm:text-sm"
            title="Download report of currently filtered tickets in Excel (.xlsx) format"
          >
            <FileSpreadsheet size={15} className="mr-1.5 shrink-0" />
            Excel Report
          </Button>
        )}
        {onExportCsv && (
          <Button
            type="button"
            onClick={onExportCsv}
            loading={exporting === 'csv'}
            variant="outline"
            className="h-10 flex-1 font-bold border-slate-300 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm"
            title="Download report of currently filtered tickets in CSV (.csv) format"
          >
            <Download size={15} className="mr-1.5 shrink-0" />
            CSV
          </Button>
        )}
        {hasActiveFilters && onResetFilters && (
          <Button
            type="button"
            variant="ghost"
            onClick={onResetFilters}
            className="h-10 px-2.5 text-xs text-[var(--ink-muted)] hover:text-rose-600"
            title="Reset all active filters"
          >
            <RotateCcw size={14} className="mr-1" />
            Reset
          </Button>
        )}
      </div>

      {extra && <div className="flex flex-col gap-1.5">{extra}</div>}

      {/* Active Filter Pill Summary Banner */}
      {hasActiveFilters && (
        <div className="col-span-full mt-1 flex flex-wrap items-center gap-2 rounded-lg bg-blue-50/70 border border-blue-200/80 px-3 py-2 text-xs text-blue-950">
          <span className="font-bold text-blue-900 flex items-center gap-1">
            Active Filters ({filteredCount !== undefined ? `${filteredCount} tickets match` : 'Filtered'}):
          </span>
          {fromDate && toDate && (
            <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 font-medium border border-blue-200 text-blue-800">
               Date: {fromDate} → {toDate}
            </span>
          )}
          {fromDate && !toDate && (
            <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 font-medium border border-blue-200 text-blue-800">
               From: {fromDate}
            </span>
          )}
          {!fromDate && toDate && (
            <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 font-medium border border-blue-200 text-blue-800">
               To: {toDate}
            </span>
          )}
          {status && (
            <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 font-medium border border-blue-200 text-blue-800">
              Status: {formatLabel(status)}
            </span>
          )}
          {priority && (
            <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 font-medium border border-blue-200 text-blue-800">
              Priority: {formatLabel(priority)}
            </span>
          )}
          {department && (
            <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 font-medium border border-blue-200 text-blue-800">
              Dept: {departments.find((d) => d._id === department)?.name || department}
            </span>
          )}
          {search && (
            <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 font-medium border border-blue-200 text-blue-800">
              Search: "{search}"
            </span>
          )}
          <span className="ml-auto text-[11px] text-blue-700 font-medium italic">
            ⬇ Download will include only this filtered data
          </span>
          {onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer flex items-center gap-0.5 ml-2"
            >
              <X size={12} /> Clear all
            </button>
          )}
        </div>
      )}
    </div>
  )
}
