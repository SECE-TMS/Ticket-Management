import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
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
import { superadminService, type SuperAdminDashboardData } from '../../services/superadminService'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { Button } from '../../components/common/Button'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../lib/utils'

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const DEPT_COLORS = [
  '#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626',
  '#0891b2', '#9333ea', '#16a34a', '#ea580c', '#be123c',
]

export function SuperAdminAnalytics() {
  const toast = useToast()
  const [data, setData] = useState<SuperAdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await superadminService.getDashboard()
      setData(res)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load analytics data'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  if (loading) return <PageLoader />
  if (!data) return null

  const { totals, monthlyTrend, departmentReport } = data

  // Monthly Trend Data
  const trendMap = new Map<string, { created: number; resolved: number }>()
  monthlyTrend.forEach((item) => {
    trendMap.set(`${item._id.year}-${item._id.month}`, {
      created: item.created,
      resolved: item.resolved,
    })
  })

  const now = new Date()
  const monthlyChartData = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const yr = d.getFullYear()
    const mo = d.getMonth() + 1
    const match = trendMap.get(`${yr}-${mo}`) || { created: 0, resolved: 0 }
    monthlyChartData.push({
      name: `${MONTH_NAMES[mo]} ${yr}`,
      Created: match.created,
      Resolved: match.resolved,
      ResolutionVelocity: match.created > 0 ? Math.round((match.resolved / match.created) * 100) : 100,
    })
  }

  // Department Share Data
  const activeDeptPieData = departmentReport
    .filter((d) => d.stats.total > 0)
    .map((d, index) => ({
      name: d.name,
      value: d.stats.total,
      color: DEPT_COLORS[index % DEPT_COLORS.length],
    }))

  const totalDeptTickets = activeDeptPieData.reduce((sum, d) => sum + d.value, 0)

  // Role Composition
  const userRoleData = [
    { name: 'Admins', value: totals.admins, color: '#7c3aed' },
    { name: 'Managers', value: totals.managers, color: '#059669' },
    { name: 'Employees', value: totals.employees, color: '#d97706' },
  ].filter((r) => r.value > 0)

  const totalManagedUsers = totals.admins + totals.managers + totals.employees

  // SLA & Resolution Calculations
  const overallResolutionRate = totals.tickets > 0 ? Math.round((totals.closedTickets / totals.tickets) * 100) : 0
  const slaComplianceRate = totals.tickets > 0 ? Math.max(0, Math.round(((totals.tickets - totals.overdueTickets) / totals.tickets) * 100)) : 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--ink)]">Executive System Analytics</h1>
          <p className="text-sm text-[var(--ink-muted)]">
            High-level operational intelligence, SLA compliance, capacity & trends.
          </p>
        </div>
        <Button id="sa-analytics-refresh" type="button" onClick={() => void load()}>
          <RefreshCw size={15} /> Refresh Analytics
        </Button>
      </div>

      {/* Intelligence KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              {/* <TrendingUp size={22} /> */}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">Overall Resolution</p>
              <p className="text-2xl font-bold text-[var(--ink)]">{overallResolutionRate}%</p>
              <p className="text-[11px] text-[var(--ink-muted)]">{totals.closedTickets} of {totals.tickets} resolved</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              {/* <ShieldCheck size={22} /> */}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">SLA Compliance</p>
              <p className="text-2xl font-bold text-[var(--success)]">{slaComplianceRate}%</p>
              <p className="text-[11px] text-[var(--ink-muted)]">{totals.overdueTickets} overdue tickets</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              {/* <Users size={22} /> */}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">Active Staff Pool</p>
              <p className="text-2xl font-bold text-[var(--ink)]">{totals.managers + totals.employees}</p>
              <p className="text-[11px] text-[var(--ink-muted)]">{totals.admins} platform admins</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              {/* <Clock size={22} /> */}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">Active Ticket Backlog</p>
              <p className="text-2xl font-bold text-amber-600">{totals.openTickets + totals.pendingApprovalTickets}</p>
              <p className="text-[11px] text-[var(--ink-muted)]">{totals.pendingApprovalTickets} awaiting review</p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 1: Volume Trend & Ticket Share */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Monthly Volume & Velocity Trend */}
        <div className="lg:col-span-8 rounded-2xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs flex flex-col justify-between">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* <TrendingUp size={18} className="text-[var(--primary-blue)]" /> */}
              <h3 className="font-bold text-[var(--ink)]">6-Month Ticket Creation vs Resolution</h3>
            </div>
            {/* <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--primary-blue)] border border-blue-200">
              Monthly Timeline
            </span> */}
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="analyticsCreatedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="analyticsResolvedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--ink-muted)' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--ink-muted)' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--white)',
                    borderColor: 'var(--border)',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Area
                  type="monotone"
                  dataKey="Created"
                  name="Created Tickets"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#analyticsCreatedGrad)"
                  dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                />
                <Area
                  type="monotone"
                  dataKey="Resolved"
                  name="Resolved Tickets"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#analyticsResolvedGrad)"
                  dot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Volume Share */}
        <div className="lg:col-span-4 rounded-2xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs flex flex-col justify-between">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* <Building2 size={18} className="text-[var(--primary-blue)]" /> */}
              <h3 className="font-bold text-[var(--ink)]">Department Share</h3>
            </div>
          </div>

          {activeDeptPieData.length > 0 ? (
            <div className="flex flex-col items-center">
              <div className="h-44 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activeDeptPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={68}
                      paddingAngle={4}
                    >
                      {activeDeptPieData.map((item, i) => (
                        <Cell key={i} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: unknown) => [`${v} tickets`, 'Volume']}
                      contentStyle={{
                        backgroundColor: 'var(--white)',
                        borderColor: 'var(--border)',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-lg font-extrabold text-[var(--ink)]">{totalDeptTickets}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--ink-muted)]">Tickets</span>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs">
                {activeDeptPieData.map((item, i) => {
                  const pct = totalDeptTickets > 0 ? Math.round((item.value / totalDeptTickets) * 100) : 0
                  return (
                    <div key={i} className="flex items-center gap-1.5 font-medium text-[var(--ink)]">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="truncate max-w-[100px]">{item.name}</span>
                      <span className="text-[var(--ink-muted)] font-bold">({pct}%)</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="flex h-56 flex-col items-center justify-center text-sm text-[var(--ink-muted)]">
              No department ticket volume recorded.
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Department SLA Comparison & Staff Role Mix */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Department SLA Load Comparison */}
        <div className="lg:col-span-8 rounded-2xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs flex flex-col justify-between">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* <BarChart3 size={18} className="text-[var(--primary-blue)]" /> */}
              <h3 className="font-bold text-[var(--ink)]">Department Resolution & Overdue Analysis</h3>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={departmentReport.map((d) => ({
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
                <Bar dataKey="Open" fill="#d97706" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="Closed" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="Overdue" fill="#dc2626" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Staff Role Composition */}
        <div className="lg:col-span-4 rounded-2xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs flex flex-col justify-between">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* <Users size={18} className="text-purple-600" /> */}
              <h3 className="font-bold text-[var(--ink)]">Staff Role Mix</h3>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="h-44 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userRoleData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={68}
                    paddingAngle={4}
                  >
                    {userRoleData.map((item, i) => (
                      <Cell key={i} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: unknown) => [`${v} users`, 'Count']}
                    contentStyle={{
                      backgroundColor: 'var(--white)',
                      borderColor: 'var(--border)',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-extrabold text-[var(--ink)]">{totalManagedUsers}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--ink-muted)]">Staff</span>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs">
              {userRoleData.map((item, i) => {
                const pct = totalManagedUsers > 0 ? Math.round((item.value / totalManagedUsers) * 100) : 0
                return (
                  <div key={i} className="flex items-center gap-1.5 font-medium text-[var(--ink)]">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                    <span className="text-[var(--ink-muted)] font-bold">({item.value} • {pct}%)</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
