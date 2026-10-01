import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  Crown,
  RefreshCw,
  ShieldCheck,
  Star,
  Ticket,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { superadminService, type SuperAdminDashboardData, type DeptReport } from '../../services/superadminService'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { Button } from '../../components/common/Button'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../lib/utils'

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const DEPT_COLORS = [
  '#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626',
  '#0891b2', '#9333ea', '#16a34a', '#ea580c', '#be123c',
]

interface KpiProps {
  label: string
  value: string | number
  icon: React.ElementType
  color: string
  sub?: string
}

function KpiCard({ label, value, icon: Icon, color, sub }: KpiProps) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs flex items-start gap-4">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${color}18` }}
      >
        <Icon size={22} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-[var(--ink)]">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-[var(--ink-muted)]">{sub}</p>}
      </div>
    </div>
  )
}

export function SuperAdminDashboard() {
  const toast = useToast()
  const [data, setData] = useState<SuperAdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await superadminService.getDashboard()
      setData(res)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load dashboard'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  if (loading) return <PageLoader />
  if (!data) return null

  const { totals, monthlyTrend, departmentReport } = data

  const monthlyChartData = monthlyTrend.map((item) => ({
    name: `${MONTH_NAMES[item._id.month]} ${item._id.year}`,
    Created: item.created,
    Resolved: item.resolved,
  }))

  // Department pie chart data
  const deptPieData = departmentReport.map((d) => ({
    name: d.name,
    value: d.stats.total,
  }))

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100">
            <Crown size={24} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--ink)]">Super Admin Dashboard</h1>
            <p className="text-sm text-[var(--ink-muted)]">Full system overview & control</p>
          </div>
        </div>
        <Button id="sa-refresh" type="button" onClick={() => void load()}>
          <RefreshCw size={15} />
          Refresh
        </Button>
      </div>

      {/* KPI Row — Users */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
          System Users
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard label="Total Users" value={totals.users} icon={Users} color="#2563eb" />
          <KpiCard label="Admins" value={totals.admins} icon={ShieldCheck} color="#7c3aed" sub="Portal admins" />
          <KpiCard label="Managers" value={totals.managers} icon={Users} color="#059669" />
          <KpiCard label="Employees" value={totals.employees} icon={Users} color="#d97706" />
        </div>
      </div>

      {/* KPI Row — Tickets */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
          Ticket Overview
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          <KpiCard label="Total Tickets" value={totals.tickets} icon={Ticket} color="#2563eb" />
          <KpiCard label="Open" value={totals.openTickets} icon={Clock} color="#d97706" />
          <KpiCard label="Closed" value={totals.closedTickets} icon={CheckCircle2} color="#059669" />
          <KpiCard
            label="Pending Approval"
            value={totals.pendingApprovalTickets}
            icon={ShieldCheck}
            color="#ea580c"
            sub="Awaiting review"
          />
          <KpiCard label="Overdue" value={totals.overdueTickets} icon={AlertTriangle} color="#dc2626" />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Monthly Trend Line Chart */}
        <div className="col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-[var(--primary-blue)]" />
            <h3 className="font-bold text-[var(--ink)]">Monthly Ticket Trend</h3>
          </div>
          {monthlyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Created" stroke="#2563eb" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Resolved" stroke="#059669" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-sm text-[var(--ink-muted)]">
              No trend data yet
            </div>
          )}
        </div>

        {/* Department Pie Chart */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs">
          <div className="mb-4 flex items-center gap-2">
            <Building2 size={18} className="text-[var(--primary-blue)]" />
            <h3 className="font-bold text-[var(--ink)]">Tickets by Dept.</h3>
          </div>
          {deptPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={deptPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {deptPieData.map((_, i) => (
                    <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [v, 'Tickets']} />
                <Legend
                  formatter={(value) =>
                    value.length > 14 ? value.slice(0, 14) + '…' : value
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-sm text-[var(--ink-muted)]">
              No data
            </div>
          )}
        </div>
      </div>

      {/* Department-wise Report Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] shadow-xs overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[var(--border)] p-5">
          <BarChart3 size={18} className="text-[var(--primary-blue)]" />
          <h3 className="font-bold text-[var(--ink)]">Department-wise Report</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">Department</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">Total</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">Open</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">Pending ✓</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">Closed</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">Overdue</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">Res. Rate</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">Avg Rating</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">Staff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {departmentReport.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-sm text-[var(--ink-muted)]">
                    No departments found
                  </td>
                </tr>
              )}
              {departmentReport.map((dept) => (
                <tr key={dept.departmentId} className="hover:bg-[var(--surface)] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-[var(--ink)]">{dept.name}</div>
                    <div className="text-xs text-[var(--ink-muted)]">
                      {dept.isActive ? (
                        <span className="text-[var(--success)]">● Active</span>
                      ) : (
                        <span className="text-[var(--danger)]">● Inactive</span>
                      )}
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
                  <td className="px-4 py-3.5 text-right">
                    <span className="text-xs font-semibold text-[var(--ink)]">{dept.staff.total}</span>
                    <span className="text-xs text-[var(--ink-muted)]"> ({dept.staff.managers}M/{dept.staff.employees}E)</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bar chart for quick visual comparison */}
        {departmentReport.length > 0 && (
          <div className="border-t border-[var(--border)] p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
              Department Comparison
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={departmentReport.map((d) => ({
                  name: d.name.length > 12 ? d.name.slice(0, 12) + '…' : d.name,
                  Open: d.stats.open,
                  Closed: d.stats.closed,
                  Overdue: d.stats.overdue,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Open" fill="#d97706" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Closed" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Overdue" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
