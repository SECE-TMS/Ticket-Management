import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  Building2,
  Download,
  Eye,
  FileSpreadsheet,
  Filter,
  RefreshCw,
  Search,
  Star,
  Users,
  X,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { superadminService, type DeptReport } from '../../services/superadminService'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { Button } from '../../components/common/Button'
import { Modal } from '../../components/common/Modal'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../lib/utils'

export function SuperAdminDepartments() {
  const toast = useToast()
  const [departments, setDepartments] = useState<DeptReport[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'overdue'>('all')
  const [sortBy, setSortBy] = useState<'total' | 'resolutionRate' | 'avgRating' | 'staff' | 'name'>('total')
  const [activeReportDept, setActiveReportDept] = useState<DeptReport | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'charts'>('table')

  const load = async () => {
    setLoading(true)
    try {
      const res = await superadminService.getDepartmentReport()
      setDepartments(res || [])
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load department report'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  // Filtered & Sorted departments
  const filteredDepartments = useMemo(() => {
    return departments
      .filter((dept) => {
        const matchesDept = selectedDeptId === 'all' || dept.departmentId === selectedDeptId
        const matchesSearch =
          dept.name.toLowerCase().includes(search.toLowerCase()) ||
          (dept.description && dept.description.toLowerCase().includes(search.toLowerCase()))

        let matchesStatus = true
        if (statusFilter === 'active') {
          matchesStatus = dept.isActive !== false
        } else if (statusFilter === 'inactive') {
          matchesStatus = dept.isActive === false
        } else if (statusFilter === 'overdue') {
          matchesStatus = dept.stats.overdue > 0
        }

        return matchesDept && matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        if (sortBy === 'total') return b.stats.total - a.stats.total
        if (sortBy === 'resolutionRate') return b.stats.resolutionRate - a.stats.resolutionRate
        if (sortBy === 'avgRating') return b.stats.avgRating - a.stats.avgRating
        if (sortBy === 'staff') return b.staff.total - a.staff.total
        if (sortBy === 'name') return a.name.localeCompare(b.name)
        return 0
      })
  }, [departments, search, selectedDeptId, statusFilter, sortBy])

  // Active dataset for Summary Metrics (either filtered or single department)
  const displayDepartments = useMemo(() => {
    if (selectedDeptId !== 'all') {
      const single = departments.find((d) => d.departmentId === selectedDeptId)
      return single ? [single] : filteredDepartments
    }
    return filteredDepartments
  }, [departments, selectedDeptId, filteredDepartments])

  // Summary Metrics
  const totalDepts = displayDepartments.length
  const activeDepts = displayDepartments.filter((d) => d.isActive !== false).length
  const totalTickets = displayDepartments.reduce((acc, d) => acc + d.stats.total, 0)
  const totalOpen = displayDepartments.reduce((acc, d) => acc + d.stats.open, 0)
  const totalPendingApproval = displayDepartments.reduce((acc, d) => acc + d.stats.pendingApproval, 0)
  const totalOverdue = displayDepartments.reduce((acc, d) => acc + d.stats.overdue, 0)
  const totalStaff = displayDepartments.reduce((acc, d) => acc + d.staff.total, 0)
  const totalManagers = displayDepartments.reduce((acc, d) => acc + d.staff.managers, 0)
  const totalEmployees = displayDepartments.reduce((acc, d) => acc + d.staff.employees, 0)

  const overallAvgRating = useMemo(() => {
    const totalWithRating = displayDepartments.filter((d) => d.stats.avgRating > 0 && d.stats.totalFeedback > 0)
    if (totalWithRating.length === 0) return 0
    const totalScore = totalWithRating.reduce((sum, d) => sum + d.stats.avgRating * d.stats.totalFeedback, 0)
    const totalFeedbackCount = totalWithRating.reduce((sum, d) => sum + d.stats.totalFeedback, 0)
    return totalFeedbackCount > 0 ? Number((totalScore / totalFeedbackCount).toFixed(1)) : 0
  }, [displayDepartments])

  // Export CSV (Single or Filtered Departments)
  const handleExportCSV = (targetDepts: DeptReport[] = filteredDepartments, filenameSuffix = 'All') => {
    if (targetDepts.length === 0) {
      toast.error('No department records available to export.')
      return
    }

    const headers = [
      'Department Name',
      'Status',
      'Total Tickets',
      'Open Tickets',
      'Pending Approval',
      'Closed Tickets',
      'Overdue Tickets',
      'Resolution Rate (%)',
      'Avg CSAT Rating',
      'Total Feedbacks',
      'Managers',
      'Employees',
      'Total Staff',
    ]

    const rows = targetDepts.map((d) => [
      `"${d.name.replace(/"/g, '""')}"`,
      d.isActive !== false ? 'Active' : 'Inactive',
      d.stats.total,
      d.stats.open,
      d.stats.pendingApproval,
      d.stats.closed,
      d.stats.overdue,
      `${d.stats.resolutionRate}%`,
      d.stats.avgRating > 0 ? d.stats.avgRating.toFixed(1) : 'N/A',
      d.stats.totalFeedback,
      d.staff.managers,
      d.staff.employees,
      d.staff.total,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `TMS_Department_Report_${filenameSuffix}_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Exported ${targetDepts.length} department report records`)
  }

  if (loading) return <PageLoader />

  const isFilteredToSingle = selectedDeptId !== 'all'
  const selectedDeptObj = departments.find((d) => d.departmentId === selectedDeptId)

  return (
    <div className="space-y-4">
      {/* Unified Header & Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--ink)]">Department Performance</h1>
          {selectedDeptObj && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[var(--primary-blue)] border border-blue-200 shadow-2xs">
              <Building2 size={13} />
              {selectedDeptObj.name}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Switcher */}
          <div className="inline-flex rounded-xl bg-[var(--surface-2)] p-1 border border-[var(--border)]">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[var(--white)] text-[var(--primary-blue)] shadow-xs font-extrabold'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
              }`}
            >
              📋 Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode('charts')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'charts'
                  ? 'bg-[var(--white)] text-[var(--primary-blue)] shadow-xs font-extrabold'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
              }`}
            >
              📊 Charts
            </button>
          </div>

          {isFilteredToSingle && selectedDeptObj ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportCSV([selectedDeptObj], selectedDeptObj.name.replace(/\s+/g, '_'))}
              className="font-bold border-[var(--primary-blue)] text-[var(--primary-blue)] hover:bg-blue-50 py-2 text-xs sm:text-sm"
            >
              <FileSpreadsheet size={15} className="mr-1.5" /> Export {selectedDeptObj.name}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportCSV(filteredDepartments, 'Filtered')}
              className="font-bold py-2 text-xs sm:text-sm"
            >
              <Download size={15} className="mr-1.5" /> Export CSV
            </Button>
          )}

          <Button
            id="sa-dept-refresh"
            size="sm"
            type="button"
            onClick={() => void load()}
            className="py-2 text-xs sm:text-sm font-bold shadow-xs"
          >
            <RefreshCw size={15} className="mr-1.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* 5-Metric KPI Strip with Clear Font Sizes */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-3.5 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">Departments</span>
            <p className="text-base sm:text-lg font-bold text-[var(--ink)] truncate max-w-[140px]">
              {isFilteredToSingle && selectedDeptObj ? selectedDeptObj.name : `${totalDepts} Units`}
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-[var(--success)] border border-emerald-200">
            {activeDepts} Active
          </span>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-3.5 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">Staff Roster</span>
            <p className="text-base sm:text-lg font-bold text-[var(--ink)]">{totalStaff} Total</p>
          </div>
          <span className="text-xs font-semibold text-[var(--ink-muted)] bg-[var(--surface)] px-2 py-0.5 rounded-md border border-[var(--border)]">
            {totalManagers}M • {totalEmployees}E
          </span>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-3.5 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">Total Tickets</span>
            <p className="text-base sm:text-lg font-bold text-[var(--ink)]">{totalTickets}</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            {totalOpen} Open
          </span>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-3.5 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">Avg CSAT</span>
            <p className="text-base sm:text-lg font-bold text-amber-600 flex items-center gap-1">
              <Star size={16} className="fill-amber-400 text-amber-400" />
              {overallAvgRating > 0 ? overallAvgRating.toFixed(1) : '—'}
            </p>
          </div>
          <span className="text-xs font-semibold text-[var(--ink-muted)]">
            {displayDepartments.reduce((acc, d) => acc + d.stats.totalFeedback, 0)} Reviews
          </span>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-3.5 shadow-2xs flex items-center justify-between col-span-2 sm:col-span-1">
          <div className="space-y-0.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">Overdue SLA</span>
            <p className={`text-base sm:text-lg font-bold ${totalOverdue > 0 ? 'text-[var(--danger)]' : 'text-[var(--ink)]'}`}>
              {totalOverdue} Overdue
            </p>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            totalPendingApproval > 0 
              ? 'bg-orange-50 text-orange-700 border border-orange-200' 
              : 'bg-blue-50 text-[var(--primary-blue)] border border-blue-200'
          }`}>
            {totalPendingApproval > 0 ? `${totalPendingApproval} Pending` : 'On Track'}
          </span>
        </div>
      </div>

      {/* Streamlined Filter & Search Toolbar with larger controls */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          {/* Left search */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
            <input
              type="text"
              placeholder="Search by department name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-10 pr-3.5 py-2 text-sm font-medium text-[var(--ink)] placeholder:text-[var(--ink-muted)] outline-none focus:border-[var(--primary-blue)] focus:bg-[var(--white)] transition-all"
            />
          </div>

          {/* Right filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Department selector dropdown */}
            <div className="flex items-center gap-1.5 bg-[var(--surface)] px-3 py-1.5 rounded-xl border border-[var(--border)]">
              <Building2 size={15} className="text-[var(--primary-blue)] shrink-0" />
              <select
                id="filter-department-select"
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="bg-transparent text-sm font-semibold text-[var(--ink)] outline-none cursor-pointer pr-1 max-w-[180px]"
              >
                <option value="all">All Units ({departments.length})</option>
                {departments.map((d) => (
                  <option key={d.departmentId} value={d.departmentId}>
                    {d.name} ({d.stats.total})
                  </option>
                ))}
              </select>
            </div>

            {selectedDeptId !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedDeptId('all')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-100 text-[var(--primary-blue)] hover:bg-blue-200 text-xs font-bold transition-all cursor-pointer"
              >
                <X size={14} /> Clear
              </button>
            )}

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-[var(--surface)] px-3 py-1.5 rounded-xl border border-[var(--border)]">
              <Filter size={14} className="text-[var(--ink-muted)] shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-transparent text-sm font-semibold text-[var(--ink)] outline-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
                <option value="overdue">Overdue ⚠️</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center gap-1.5 bg-[var(--surface)] px-3 py-1.5 rounded-xl border border-[var(--border)]">
              <span className="text-xs font-bold text-[var(--ink-muted)]">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-sm font-semibold text-[var(--ink)] outline-none cursor-pointer"
              >
                <option value="total">Tickets (High-Low)</option>
                <option value="resolutionRate">Resolution %</option>
                <option value="avgRating">CSAT Rating</option>
                <option value="staff">Staff Count</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Table View (Spacious, breathable, perfectly fits screen) OR Charts View */}
      {viewMode === 'table' ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] shadow-xs overflow-hidden">
          <div className="max-h-[calc(100vh-275px)] overflow-y-auto">
            <table className="w-full border-collapse table-auto text-left">
              <thead className="sticky top-0 z-10 bg-[var(--primary-blue)] text-white text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5 first:rounded-tl-2xl">Department</th>
                  <th className="px-4 py-3.5">Ticket Status &amp; Volume</th>
                  <th className="px-4 py-3.5 text-center">Resolution</th>
                  <th className="px-4 py-3.5 text-center">CSAT</th>
                  <th className="px-4 py-3.5 text-center">Staff Roster</th>
                  <th className="px-5 py-3.5 text-right last:rounded-tr-2xl">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredDepartments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-base text-[var(--ink-muted)] font-medium">
                      No departments match your current search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredDepartments.map((dept) => (
                    <tr key={dept.departmentId} className="hover:bg-blue-50/40 transition-colors">
                      {/* Department Info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-2xs tracking-wide">
                            {dept.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-[var(--ink)] text-sm">{dept.name}</span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                dept.isActive !== false
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-gray-100 text-gray-600 border border-gray-200'
                              }`}>
                                {dept.isActive !== false ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            {dept.description && (
                              <p className="text-xs text-[var(--ink-muted)] truncate mt-0.5" title={dept.description}>
                                {dept.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Ticket Volume & Breakdown */}
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[var(--surface)] text-xs font-bold text-[var(--ink)] border border-[var(--border)]">
                            {dept.stats.total} Total
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${
                            dept.stats.open > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-50 text-slate-400 border border-slate-200'
                          }`}>
                            {dept.stats.open} Open
                          </span>
                          {dept.stats.pendingApproval > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
                              {dept.stats.pendingApproval} Pending
                            </span>
                          )}
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {dept.stats.closed} Closed
                          </span>
                          {dept.stats.overdue > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-extrabold bg-red-50 text-red-700 border border-red-200 animate-pulse">
                              {dept.stats.overdue} Overdue
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Resolution Rate */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-bold text-sm text-[var(--ink)]">{dept.stats.resolutionRate}%</span>
                          <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100 border border-slate-200/60">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                              style={{ width: `${dept.stats.resolutionRate}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* CSAT Rating */}
                      <td className="px-4 py-4 text-center">
                        {dept.stats.avgRating > 0 ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900 shadow-2xs">
                            <Star size={13} className="text-amber-500 fill-amber-400" />
                            <span>{dept.stats.avgRating.toFixed(1)}</span>
                            <span className="text-[11px] text-amber-700/80 font-normal">({dept.stats.totalFeedback})</span>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-[var(--ink-muted)]">—</span>
                        )}
                      </td>

                      {/* Staff Breakdown */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-bold text-[var(--ink)]">{dept.staff.total} Total Staff</span>
                          <span className="text-[11px] text-[var(--ink-muted)] font-medium">
                            {dept.staff.managers} Mgr • {dept.staff.employees} Staff
                          </span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActiveReportDept(dept)}
                          className="text-xs font-bold text-[var(--primary-blue)] border-blue-200 hover:bg-blue-50 rounded-xl shadow-2xs py-1.5 px-3 h-auto inline-flex items-center"
                        >
                          <Eye size={13} className="mr-1.5" /> View Report
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Visual Staff & Workload Comparison Charts */
        displayDepartments.length > 0 && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs flex flex-col justify-between">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 size={18} className="text-[var(--primary-blue)]" />
                  <h3 className="font-bold text-sm text-[var(--ink)]">
                    {isFilteredToSingle ? `${selectedDeptObj?.name} Status Breakdown` : 'Ticket Status by Department'}
                  </h3>
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={displayDepartments.map((d) => ({
                      name: d.name.length > 12 ? d.name.slice(0, 12) + '…' : d.name,
                      Open: d.stats.open,
                      Pending: d.stats.pendingApproval,
                      Closed: d.stats.closed,
                      Overdue: d.stats.overdue,
                    }))}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--ink-muted)' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--ink-muted)' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--white)',
                        borderColor: 'var(--border)',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '6px' }} />
                    <Bar dataKey="Open" fill="#d97706" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="Pending" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="Closed" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="Overdue" fill="#dc2626" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs flex flex-col justify-between">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-purple-600" />
                  <h3 className="font-bold text-sm text-[var(--ink)]">
                    {isFilteredToSingle ? `${selectedDeptObj?.name} Staff Composition` : 'Staff Allocation by Department'}
                  </h3>
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={displayDepartments.map((d) => ({
                      name: d.name.length > 12 ? d.name.slice(0, 12) + '…' : d.name,
                      Managers: d.staff.managers,
                      Employees: d.staff.employees,
                    }))}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--ink-muted)' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--ink-muted)' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--white)',
                        borderColor: 'var(--border)',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '6px' }} />
                    <Bar dataKey="Managers" fill="#7c3aed" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="Employees" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )
      )}

      {/* Department-Wise Detailed Report Modal */}
      {activeReportDept && (
        <Modal
          open={!!activeReportDept}
          onClose={() => setActiveReportDept(null)}
          title={`Department Audit Report: ${activeReportDept.name}`}
          size="lg"
        >
          <div className="space-y-5">
            {/* Header info card */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-[var(--ink)] text-base">{activeReportDept.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeReportDept.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                    }`}>
                    {activeReportDept.isActive !== false ? 'Active Department' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-[var(--ink-muted)] mt-1">
                  {activeReportDept.description || 'No description provided.'}
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleExportCSV([activeReportDept], activeReportDept.name.replace(/\s+/g, '_'))}
                className="font-bold shrink-0 shadow-xs"
              >
                <Download size={14} className="mr-1" /> Export CSV Report
              </Button>
            </div>

            {/* Department stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                <p className="text-[11px] font-semibold text-[var(--ink-muted)] uppercase">Total Volume</p>
                <p className="text-xl font-bold text-[var(--ink)] mt-1">{activeReportDept.stats.total}</p>
                <p className="text-[10px] text-[var(--ink-muted)]">All time raised</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                <p className="text-[11px] font-semibold text-[var(--ink-muted)] uppercase">Resolution Rate</p>
                <p className="text-xl font-bold text-[var(--success)] mt-1">{activeReportDept.stats.resolutionRate}%</p>
                <p className="text-[10px] text-[var(--ink-muted)]">{activeReportDept.stats.closed} resolved/closed</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                <p className="text-[11px] font-semibold text-[var(--ink-muted)] uppercase">Overdue Tickets</p>
                <p className={`text-xl font-bold mt-1 ${activeReportDept.stats.overdue > 0 ? 'text-[var(--danger)]' : 'text-[var(--ink)]'}`}>
                  {activeReportDept.stats.overdue}
                </p>
                <p className="text-[10px] text-[var(--ink-muted)]">Exceeded target SLA</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                <p className="text-[11px] font-semibold text-[var(--ink-muted)] uppercase">CSAT Rating</p>
                <p className="text-xl font-bold text-amber-600 mt-1 flex items-center justify-center gap-1">
                  <Star size={16} className="fill-amber-400 text-amber-400" />
                  {activeReportDept.stats.avgRating > 0 ? activeReportDept.stats.avgRating.toFixed(1) : '—'}
                </p>
                <p className="text-[10px] text-[var(--ink-muted)]">({activeReportDept.stats.totalFeedback} reviews)</p>
              </div>
            </div>

            {/* Detailed Workload Breakdown */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--white)] p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)] mb-3">
                Detailed Workload Metrics
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-amber-50/60 border border-amber-200/60">
                  <span className="text-[11px] font-bold text-amber-800">In-Flight / Open</span>
                  <span className="text-lg font-bold text-amber-900">{activeReportDept.stats.open}</span>
                </div>
                <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-orange-50/60 border border-orange-200/60">
                  <span className="text-[11px] font-bold text-orange-800">Pending Approval</span>
                  <span className="text-lg font-bold text-orange-900">{activeReportDept.stats.pendingApproval}</span>
                </div>
                <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-emerald-50/60 border border-emerald-200/60">
                  <span className="text-[11px] font-bold text-emerald-800">Closed &amp; Solved</span>
                  <span className="text-lg font-bold text-emerald-900">{activeReportDept.stats.closed}</span>
                </div>
                <div className="flex flex-col gap-0.5 p-2 rounded-lg bg-purple-50/60 border border-purple-200/60">
                  <span className="text-[11px] font-bold text-purple-800">Department Roster</span>
                  <span className="text-lg font-bold text-purple-900">
                    {activeReportDept.staff.total} <span className="text-xs font-normal">({activeReportDept.staff.managers} Mgr • {activeReportDept.staff.employees} Staff)</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setActiveReportDept(null)}>
                Close Report
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
