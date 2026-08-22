import { useEffect, useState } from 'react'
import { Link, useNavigate, Link as RouterLink } from 'react-router-dom'
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  RefreshCw,
  Star,
  ThumbsUp,
  Ticket,
  TrendingUp,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { dashboardService } from '../../services/dashboardService'
import { departmentService } from '../../services/departmentService'
import { KpiCard, PageHeader } from '../../components/common/KpiCard'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { PriorityBadge, StatusBadge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../lib/utils'
import type { AdminDashboard as IAdminDashboard, Department } from '../../types'
import { getName } from '../../types'

const STATUS_COLORS: Record<string, string> = {
  new: '#3B82F6',
  assigned: '#8B5CF6',
  in_progress: '#F59E0B',
  pending_parts: '#EC4899',
  resolved: '#10B981',
  closed: '#64748B',
  rejected: '#EF4444',
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#EF4444',
  high: '#F97316',
  medium: '#F59E0B',
  low: '#10B981',
}

export function AdminDashboard() {
  const toast = useToast()
  const navigate = useNavigate()
  const [data, setData] = useState<IAdminDashboard | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [timeRange, setTimeRange] = useState('all')
  const [selectedDept, setSelectedDept] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const [dashRes, deptRes] = await Promise.all([
        dashboardService.admin({
          timeRange,
          department: selectedDept || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
        departmentService.listActive(),
      ])
      setData(dashRes)
      setDepartments(deptRes || [])
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load dashboard data'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDashboard()
  }, [timeRange, selectedDept])

  const handleCustomDateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void loadDashboard()
  }

  const handleResetFilters = () => {
    setTimeRange('all')
    setSelectedDept('')
    setStartDate('')
    setEndDate('')
  }

  // Export Performance Data as CSV
  const handleExportCSV = () => {
    if (!data) return

    let csvContent = 'data:text/csv;charset=utf-8,'

    // 1. Department Performance Section
    csvContent += 'DEPARTMENT PERFORMANCE & FEEDBACK REPORT\n'
    csvContent += 'Department Code,Department Name,Total Tickets,Open Tickets,Resolved Tickets,Overdue Tickets,Resolution Rate (%),Total Feedbacks,Avg Rating (out of 5.0),Satisfaction Rate (%)\n'

    data.deptPerformance.forEach((d) => {
      csvContent += `"${d.code}","${d.name}",${d.total},${d.open},${d.resolved},${d.overdue},${d.resolutionRate}%,${d.totalFeedback},${d.avgRating},${d.satisfactionRate}%\n`
    })

    // 2. Month-Wise Feedback Analytics Section
    csvContent += '\nMONTH-WISE FEEDBACK RATING ANALYTICS\n'
    csvContent += 'Month,Total Feedbacks,Avg Star Rating,Satisfaction Rate (%),5 Star,4 Star,3 Star,2 Star,1 Star\n'

    data.feedbackMonthlyTrend.forEach((m) => {
      csvContent += `"${m.month}",${m.totalFeedback},${m.avgRating},${m.satisfactionRate}%,${m.star5},${m.star4},${m.star3},${m.star2},${m.star1}\n`
    })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `TMS_Admin_Analytics_Report_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Analytics Report exported to CSV!')
  }

  if (loading && !data) return <PageLoader />

  const totals = data?.totals || {
    tickets: 0,
    open: 0,
    resolved: 0,
    departments: 0,
    users: 0,
    overdue: 0,
    resolutionRate: 0,
    avgRating: 0,
    totalFeedback: 0,
  }

  // Prepare Chart Data
  const statusPieData = Object.entries(data?.byStatus || {}).map(([status, count]) => ({
    name: status.replace('_', ' ').toUpperCase(),
    value: count,
    color: STATUS_COLORS[status] || '#64748B',
  }))

  const priorityPieData = Object.entries(data?.byPriority || {}).map(([prio, count]) => ({
    name: prio.toUpperCase(),
    value: count,
    color: PRIORITY_COLORS[prio] || '#64748B',
  }))

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <PageHeader
        title="Admin Analytics & Operations Hub"
        description="Facility-wide ticket health, department performance, and month-wise feedback insights."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="font-bold cursor-pointer">
              <Download size={15} /> Export Report (CSV)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadDashboard()}
              disabled={loading}
              className="font-bold cursor-pointer"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
            </Button>
          </div>
        }
      />

      {/* ── Filters Bar ─────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-[var(--primary-blue)]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
              Dashboard Filters &amp; Controls
            </span>
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs font-bold text-[var(--primary-blue)] hover:underline cursor-pointer"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Time Range */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase text-[var(--ink-muted)]">Time Period</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="h-9 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 text-xs font-semibold text-[var(--ink)] outline-none focus:border-[var(--primary-blue)]"
            >
              <option value="all">All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="year">This Year (2026)</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase text-[var(--ink-muted)]">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="h-9 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 text-xs font-semibold text-[var(--ink)] outline-none focus:border-[var(--primary-blue)]"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Date Picker Inputs */}
          {timeRange === 'custom' && (
            <form onSubmit={handleCustomDateSubmit} className="col-span-1 sm:col-span-2 flex items-end gap-2">
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase text-[var(--ink-muted)]">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 text-xs text-[var(--ink)] outline-none focus:border-[var(--primary-blue)]"
                />
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase text-[var(--ink-muted)]">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 text-xs text-[var(--ink)] outline-none focus:border-[var(--primary-blue)]"
                />
              </div>
              <Button type="submit" variant="primary" size="sm" className="h-9">
                Apply
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* ── KPI Overview Cards Grid ──────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Total Tickets" value={totals.tickets} icon={Ticket} accent="blue" />
        <KpiCard label="Open Tickets" value={totals.open} icon={Clock} accent="blue" />
        <KpiCard label="Resolved Tickets" value={totals.resolved} icon={CheckCircle2} accent="success" />
        <KpiCard label="Overdue SLA" value={totals.overdue} icon={AlertTriangle} accent="danger" />
        <KpiCard label="Resolution Rate" value={`${totals.resolutionRate}%`} icon={TrendingUp} accent="gold" />
        <KpiCard
          label="Avg CSAT Rating"
          value={totals.avgRating > 0 ? `${totals.avgRating} ★` : 'N/A'}
          icon={Star}
          accent="gold"
        />
      </div>

      {/* ── Graphical Presentation Section 1: Ticket Trends & Department Volume ── */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Monthly Ticket Creation vs Resolution Area Chart */}
        <div className="lg:col-span-7 rounded-2xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[var(--ink)] flex items-center gap-2">
                <TrendingUp size={18} className="text-[var(--primary-blue)]" />
                Monthly Ticket Creation vs. Resolution Trend
              </h2>
              <p className="text-xs text-[var(--ink-muted)]">
                Comparison of tickets logged vs. successfully resolved per month.
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold text-[var(--primary-blue)] border border-blue-200">
              Month-wise
            </span>
          </div>

          <div className="h-72 w-full">
            {data?.monthlyTrend && data.monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip
                    contentStyle={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '8px' }} />
                  <Area
                    type="monotone"
                    dataKey="created"
                    name="Created Tickets"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorCreated)"
                  />
                  <Area
                    type="monotone"
                    dataKey="resolved"
                    name="Resolved Tickets"
                    stroke="#10B981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorResolved)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-xs text-[var(--ink-muted)]">
                No monthly ticket volume data logged yet.
              </div>
            )}
          </div>
        </div>

        {/* Department-wise Ticket Breakdown Bar Chart */}
        <div className="lg:col-span-5 rounded-2xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[var(--ink)] flex items-center gap-2">
                <Building2 size={18} className="text-[var(--primary-blue)]" />
                Department Ticket Load Breakdown
              </h2>
              <p className="text-xs text-[var(--ink-muted)]">
                Total, Open, and Overdue tickets across active departments.
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            {data?.deptPerformance && data.deptPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.deptPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="code"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    interval={0}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip
                    contentStyle={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '8px' }} />
                  <Bar dataKey="total" name="Total Tickets" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="open" name="Open" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="overdue" name="Overdue" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-xs text-[var(--ink-muted)]">
                No department breakdown available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Graphical Presentation Section 2: Feedback & Customer Ratings ────── */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Month-Wise Feedback & Customer Rating Score Trend */}
        <div className="lg:col-span-7 rounded-2xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[var(--ink)] flex items-center gap-2">
                <Star size={18} className="text-amber-500 fill-amber-400" />
                Month-Wise Customer Feedback Score &amp; CSAT Trend
              </h2>
              <p className="text-xs text-[var(--ink-muted)]">
                Average feedback rating score (1.0 - 5.0) and CSAT satisfaction rate over months.
              </p>
            </div>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-extrabold text-amber-700 border border-amber-200">
              Feedback Insights
            </span>
          </div>

          <div className="h-72 w-full">
            {data?.feedbackMonthlyTrend && data.feedbackMonthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.feedbackMonthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip
                    contentStyle={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '8px' }} />
                  <Area
                    type="monotone"
                    dataKey="avgRating"
                    name="Avg Rating Score (out of 5)"
                    stroke="#F59E0B"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRating)"
                  />
                  <Bar dataKey="totalFeedback" name="Feedbacks Submitted" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-xs text-[var(--ink-muted)]">
                No customer ratings submitted yet for monthly trend analysis.
              </div>
            )}
          </div>
        </div>

        {/* Department Customer Satisfaction Score Bar Chart */}
        <div className="lg:col-span-5 rounded-2xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[var(--ink)] flex items-center gap-2">
                <ThumbsUp size={18} className="text-emerald-600" />
                Department CSAT Rating Scores
              </h2>
              <p className="text-xs text-[var(--ink-muted)]">
                Average star rating (1-5) per department.
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            {data?.deptPerformance && data.deptPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.deptPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="code" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip
                    contentStyle={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '8px' }} />
                  <Bar dataKey="avgRating" name="Avg Star Score" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-xs text-[var(--ink-muted)]">
                No rating score data recorded.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Graphical Presentation Section 3: Status & Priority Pie Charts ────── */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Status Distribution Pie */}
        <div className="lg:col-span-6 rounded-2xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs flex flex-col justify-between">
          <h2 className="text-base font-bold text-[var(--ink)] mb-3">Ticket Status Distribution</h2>
          <div className="h-64 w-full flex items-center justify-center">
            {statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-[var(--ink-muted)]">No status breakdown data.</p>
            )}
          </div>
        </div>

        {/* Priority Composition Pie */}
        <div className="lg:col-span-6 rounded-2xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs flex flex-col justify-between">
          <h2 className="text-base font-bold text-[var(--ink)] mb-3">Priority Level Composition</h2>
          <div className="h-64 w-full flex items-center justify-center">
            {priorityPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {priorityPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-[var(--ink-muted)]">No priority breakdown data.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Comprehensive Department-Wise Performance & Report Table ──────────── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[var(--ink)] flex items-center gap-2">
              <Building2 size={18} className="text-[var(--primary-blue)]" />
              Department-Wise Performance &amp; Feedback Report
            </h2>
            <p className="text-xs text-[var(--ink-muted)]">
              Detailed performance metrics, SLA compliance, resolution rate %, and satisfaction score per department.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="text-xs font-bold">
            <Download size={14} /> Export CSV
          </Button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[var(--primary-blue)] text-white font-bold uppercase tracking-wider">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Department Name</th>
                <th className="px-4 py-3 text-right">Total Tickets</th>
                <th className="px-4 py-3 text-right">Open</th>
                <th className="px-4 py-3 text-right">Resolved</th>
                <th className="px-4 py-3 text-right">Overdue</th>
                <th className="px-4 py-3 text-right">Resolution Rate</th>
                <th className="px-4 py-3 text-right">Feedbacks</th>
                <th className="px-4 py-3 text-right">Avg Score</th>
                <th className="px-4 py-3 text-right">Satisfaction Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {data?.deptPerformance && data.deptPerformance.length > 0 ? (
                data.deptPerformance.map((dept) => (
                  <tr key={dept.departmentId} className="hover:bg-[var(--primary-blue-light)] transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[var(--primary-blue)]">{dept.code}</td>
                    <td className="px-4 py-3 font-bold text-[var(--ink)]">{dept.name}</td>
                    <td className="px-4 py-3 text-right font-semibold">{dept.total}</td>
                    <td className="px-4 py-3 text-right font-semibold text-amber-600">{dept.open}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600">{dept.resolved}</td>
                    <td className="px-4 py-3 text-right font-semibold text-rose-600">{dept.overdue}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-extrabold text-emerald-700 border border-emerald-200">
                        {dept.resolutionRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-600">{dept.totalFeedback}</td>
                    <td className="px-4 py-3 text-right font-bold text-amber-600">
                      {dept.avgRating > 0 ? `${dept.avgRating} ★` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-extrabold text-amber-800 border border-amber-200">
                        {dept.satisfactionRate}% CSAT
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-4 py-6 text-center text-xs text-[var(--ink-muted)]">
                    No department data logged for selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Month-Wise Feedback & Rating Matrix Report Table ──────────────────── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[var(--ink)] flex items-center gap-2">
              <Calendar size={18} className="text-amber-500 fill-amber-400" />
              Month-Wise Feedback Rating Matrix Report
            </h2>
            <p className="text-xs text-[var(--ink-muted)]">
              Month-by-month customer feedback response counts, average scores, and star breakdowns.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-800 text-white font-bold uppercase tracking-wider">
                <th className="px-4 py-3">Month &amp; Year</th>
                <th className="px-4 py-3 text-right">Total Feedbacks</th>
                <th className="px-4 py-3 text-right">Avg Rating</th>
                <th className="px-4 py-3 text-right">Satisfaction %</th>
                <th className="px-4 py-3 text-right">5 ★ (Excellent)</th>
                <th className="px-4 py-3 text-right">4 ★ (Very Good)</th>
                <th className="px-4 py-3 text-right">3 ★ (Good)</th>
                <th className="px-4 py-3 text-right">2 ★ (Fair)</th>
                <th className="px-4 py-3 text-right">1 ★ (Poor)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {data?.feedbackMonthlyTrend && data.feedbackMonthlyTrend.length > 0 ? (
                data.feedbackMonthlyTrend.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-800">{m.month}</td>
                    <td className="px-4 py-3 text-right font-bold text-blue-600">{m.totalFeedback}</td>
                    <td className="px-4 py-3 text-right font-extrabold text-amber-600">{m.avgRating} ★</td>
                    <td className="px-4 py-3 text-right">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                        {m.satisfactionRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600">{m.star5}</td>
                    <td className="px-4 py-3 text-right font-semibold text-blue-600">{m.star4}</td>
                    <td className="px-4 py-3 text-right font-semibold text-amber-600">{m.star3}</td>
                    <td className="px-4 py-3 text-right font-semibold text-rose-500">{m.star2}</td>
                    <td className="px-4 py-3 text-right font-semibold text-red-600">{m.star1}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-xs text-[var(--ink-muted)]">
                    No month-wise feedback records available for selected period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Recent Tickets Table & Mobile Cards ────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] shadow-xs">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 sm:px-5 py-4">
          <h2 className="text-base font-bold text-[var(--ink)]">Recent Tickets Log</h2>
          <RouterLink to="/admin/tickets" className="text-xs font-semibold text-[var(--primary-blue)] hover:underline">
            View all tickets →
          </RouterLink>
        </div>

        {/* Mobile View (< md) */}
        <div className="flex flex-col divide-y divide-[var(--border)] md:hidden">
          {data?.recent && data.recent.length > 0 ? (
            data.recent.map((t) => (
              <div
                key={t._id}
                onClick={() => navigate(`/admin/tickets/${t._id}`)}
                className="p-4 hover:bg-[var(--primary-blue-light)] transition-colors cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[var(--primary-blue)]">
                    {t.ticketCode}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={t.status} />
                    <PriorityBadge priority={t.priority} />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--ink)]">{t.requester?.name || 'Valued User'}</p>
                  <p className="text-xs font-semibold text-[var(--ink)] mt-0.5">{t.complaintType}</p>
                  {t.description && (
                    <p className="text-[11px] text-[var(--ink-muted)] line-clamp-1 mt-0.5">{t.description}</p>
                  )}
                </div>
                <div className="flex items-center justify-between text-[11px] text-[var(--ink-muted)] pt-1">
                  <span>{getName(t.department)}</span>
                  <span className="font-semibold text-[var(--primary-blue)]">{getName(t.assignedTo, 'Unassigned')}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-xs text-[var(--ink-muted)]">No recent tickets found.</div>
          )}
        </div>

        {/* Desktop View (≥ md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[var(--primary-blue)] text-white/90 font-bold uppercase tracking-wider">
                <th className="px-5 py-3">Ticket ID &amp; Requester</th>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Priority</th>
                <th className="px-5 py-3">Assigned To</th>
                <th className="px-5 py-3">Complaint Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {data?.recent && data.recent.length > 0 ? (
                data.recent.map((t) => (
                  <tr
                    key={t._id}
                    onClick={() => navigate(`/admin/tickets/${t._id}`)}
                    className="cursor-pointer transition-colors hover:bg-[var(--primary-blue-light)]"
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-[var(--ink)]">
                        {t.requester?.name || 'Valued User'}
                      </div>
                      <Link
                        to={`/admin/tickets/${t._id}`}
                        className="font-mono text-xs font-bold text-[var(--primary-blue)] hover:underline block mt-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {t.ticketCode}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-[var(--ink-muted)] font-medium">{getName(t.department)}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="px-5 py-3.5 text-[var(--ink-muted)] font-medium">
                      {getName(t.assignedTo, 'Unassigned')}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-[var(--ink)]">{t.complaintType}</div>
                      <div className="text-[11px] text-[var(--ink-muted)] truncate max-w-xs">{t.description}</div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-xs text-[var(--ink-muted)]">
                    No recent tickets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
