import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  RefreshCw,
  Search,
  Star,
  Users,
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
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../lib/utils'

export function SuperAdminDepartments() {
  const toast = useToast()
  const [departments, setDepartments] = useState<DeptReport[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sortBy, setSortBy] = useState<'total' | 'resolutionRate' | 'avgRating' | 'staff' | 'name'>('total')

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
        const matchesSearch =
          dept.name.toLowerCase().includes(search.toLowerCase()) ||
          (dept.description && dept.description.toLowerCase().includes(search.toLowerCase()))
        const matchesStatus =
          statusFilter === 'all'
            ? true
            : statusFilter === 'active'
              ? dept.isActive !== false
              : dept.isActive === false
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        if (sortBy === 'total') return b.stats.total - a.stats.total
        if (sortBy === 'resolutionRate') return b.stats.resolutionRate - a.stats.resolutionRate
        if (sortBy === 'avgRating') return b.stats.avgRating - a.stats.avgRating
        if (sortBy === 'staff') return b.staff.total - a.staff.total
        if (sortBy === 'name') return a.name.localeCompare(b.name)
        return 0
      })
  }, [departments, search, statusFilter, sortBy])

  // Summary Metrics
  const totalDepts = departments.length
  const activeDepts = departments.filter((d) => d.isActive !== false).length
  const inactiveDepts = totalDepts - activeDepts
  const totalTickets = departments.reduce((acc, d) => acc + d.stats.total, 0)
  const totalStaff = departments.reduce((acc, d) => acc + d.staff.total, 0)
  const totalManagers = departments.reduce((acc, d) => acc + d.staff.managers, 0)
  const totalEmployees = departments.reduce((acc, d) => acc + d.staff.employees, 0)

  const overallAvgRating = useMemo(() => {
    const totalWithRating = departments.filter((d) => d.stats.avgRating > 0 && d.stats.totalFeedback > 0)
    if (totalWithRating.length === 0) return 0
    const totalScore = totalWithRating.reduce((sum, d) => sum + d.stats.avgRating * d.stats.totalFeedback, 0)
    const totalFeedbackCount = totalWithRating.reduce((sum, d) => sum + d.stats.totalFeedback, 0)
    return totalFeedbackCount > 0 ? Number((totalScore / totalFeedbackCount).toFixed(1)) : 0
  }, [departments])

  // Export CSV
  const handleExportCSV = () => {
    if (departments.length === 0) {
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

    const rows = departments.map((d) => [
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
    link.setAttribute('download', `TMS_Department_Report_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--ink)]">Department Performance & Audit</h1>
          <p className="text-sm text-[var(--ink-muted)]">
            Detailed department workload, staffing distribution, resolution efficiency & CSAT ratings.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="font-bold">
            <Download size={15} /> Export CSV
          </Button>
          <Button id="sa-dept-refresh" type="button" onClick={() => void load()}>
            <RefreshCw size={15} /> Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Building2 size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">Departments</p>
              <p className="text-2xl font-bold text-[var(--ink)]">{totalDepts}</p>
              <p className="text-[11px] text-[var(--ink-muted)]">
                <span className="text-[var(--success)] font-semibold">{activeDepts} Active</span> • {inactiveDepts} Inactive
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Users size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">Department Staff</p>
              <p className="text-2xl font-bold text-[var(--ink)]">{totalStaff}</p>
              <p className="text-[11px] text-[var(--ink-muted)]">
                {totalManagers} Managers • {totalEmployees} Staff
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">Total Tickets</p>
              <p className="text-2xl font-bold text-[var(--ink)]">{totalTickets}</p>
              <p className="text-[11px] text-[var(--ink-muted)]">Across all units</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">Avg CSAT Score</p>
              <p className="text-2xl font-bold text-[var(--ink)]">
                {overallAvgRating > 0 ? `${overallAvgRating} ★` : '—'}
              </p>
              <p className="text-[11px] text-[var(--ink-muted)]">User satisfaction</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-4 shadow-xs col-span-2 sm:col-span-4 lg:col-span-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">Overdue SLA</p>
              <p className="text-2xl font-bold text-[var(--danger)]">
                {departments.reduce((acc, d) => acc + d.stats.overdue, 0)}
              </p>
              <p className="text-[11px] text-[var(--ink-muted)]">Requires attention</p>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Staff & Workload Comparison Charts */}
      {departments.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Workload Comparison Bar Chart */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs flex flex-col justify-between">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-[var(--primary-blue)]" />
                <h3 className="font-bold text-[var(--ink)]">Ticket Status by Department</h3>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={departments.map((d) => ({
                    name: d.name.length > 12 ? d.name.slice(0, 12) + '…' : d.name,
                    Open: d.stats.open,
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
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Bar dataKey="Open" fill="#d97706" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="Closed" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="Overdue" fill="#dc2626" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Staff Allocation by Department */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs flex flex-col justify-between">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-purple-600" />
                <h3 className="font-bold text-[var(--ink)]">Staff Allocation by Department</h3>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={departments.map((d) => ({
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
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Bar dataKey="Managers" fill="#7c3aed" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="Employees" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
            <input
              type="text"
              placeholder="Search departments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-9 pr-3.5 py-2 text-xs font-medium text-[var(--ink)] outline-none focus:border-[var(--primary-blue)]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Filter size={14} className="text-[var(--ink-muted)]" />
              <span className="text-xs font-semibold text-[var(--ink-muted)]">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ink)] outline-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-[var(--ink-muted)]">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ink)] outline-none"
              >
                <option value="total">Highest Total Tickets</option>
                <option value="resolutionRate">Highest Resolution Rate</option>
                <option value="avgRating">Highest CSAT Rating</option>
                <option value="staff">Most Staff</option>
                <option value="name">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Comprehensive Departments Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                  Department
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                  Total
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                  Open
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                  Pending ✓
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                  Closed
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                  Overdue
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                  Resolution Rate
                </th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                  CSAT Rating
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                  Staff Breakdown
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredDepartments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-sm text-[var(--ink-muted)]">
                    No departments match your current search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredDepartments.map((dept) => (
                  <tr key={dept.departmentId} className="hover:bg-[var(--surface)] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-[var(--ink)]">{dept.name}</div>
                      <div className="text-xs text-[var(--ink-muted)] flex items-center gap-2 mt-0.5">
                        {dept.isActive !== false ? (
                          <span className="text-[var(--success)] font-medium">● Active</span>
                        ) : (
                          <span className="text-[var(--danger)] font-medium">● Inactive</span>
                        )}
                        {dept.description && <span>• {dept.description}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-[var(--ink)]">
                      {dept.stats.total}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className={`font-semibold ${dept.stats.open > 0 ? 'text-amber-600' : 'text-[var(--ink-muted)]'}`}>
                        {dept.stats.open}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className={`font-semibold ${dept.stats.pendingApproval > 0 ? 'text-orange-600' : 'text-[var(--ink-muted)]'}`}>
                        {dept.stats.pendingApproval}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="font-semibold text-[var(--success)]">{dept.stats.closed}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className={`font-semibold ${dept.stats.overdue > 0 ? 'text-[var(--danger)]' : 'text-[var(--ink-muted)]'}`}>
                        {dept.stats.overdue}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-bold text-[var(--ink)]">{dept.stats.resolutionRate}%</span>
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--border)]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[var(--primary-blue)] to-[var(--success)]"
                            style={{ width: `${dept.stats.resolutionRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {dept.stats.avgRating > 0 ? (
                        <div className="flex items-center justify-end gap-1">
                          <Star size={13} className="text-amber-400 fill-amber-400" />
                          <span className="font-semibold text-[var(--ink)]">{dept.stats.avgRating.toFixed(1)}</span>
                          <span className="text-xs text-[var(--ink-muted)]">({dept.stats.totalFeedback})</span>
                        </div>
                      ) : (
                        <span className="text-[var(--ink-muted)]">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-[var(--ink)]">{dept.staff.total} Total</span>
                        <span className="text-[11px] text-[var(--ink-muted)]">
                          {dept.staff.managers} Mgr • {dept.staff.employees} Staff
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
