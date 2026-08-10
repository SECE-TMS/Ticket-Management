import { useEffect, useState } from 'react'
import { Link, Link as RouterLink } from 'react-router-dom'
import { AlertTriangle, Building2, Ticket, Users } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { dashboardService } from '../../services/dashboardService'
import { KpiCard, PageHeader } from '../../components/common/KpiCard'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { StatusBadge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../lib/utils'
import type { AdminDashboard } from '../../types'
import { getName } from '../../types'

export function AdminDashboard() {
  const toast = useToast()
  const [data, setData] = useState<AdminDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        setData(await dashboardService.admin())
      } catch (err) {
        toast.error(getErrorMessage(err, 'Failed to load dashboard'))
      } finally {
        setLoading(false)
      }
    })()
  }, [toast])

  if (loading) return <PageLoader />
  if (!data) return null

  const chartData = data.byDepartment.map((d) => ({
    name: d.name || 'Unknown',
    count: d.count,
  }))

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        description="Facility-wide ticket health and staffing overview."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/tickets">
              <Button size="sm" variant="primary">Manage Tickets</Button>
            </Link>
            <Link to="/admin/departments">
              <Button size="sm" variant="outline">Departments</Button>
            </Link>
            <Link to="/admin/users">
              <Button size="sm" variant="outline">Users</Button>
            </Link>
          </div>
        }
      />

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Total Tickets" value={data.totals.tickets} icon={Ticket} accent="blue" />
        <KpiCard label="Open" value={data.totals.open} icon={Ticket} accent="blue" />
        <KpiCard label="Overdue" value={data.totals.overdue} icon={AlertTriangle} accent="danger" />
        <KpiCard label="Departments" value={data.totals.departments} icon={Building2} accent="gold" />
        <KpiCard label="Active Staff" value={data.totals.users} icon={Users} accent="success" />
      </div>

      {/* Charts row */}
      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        {/* Bar chart */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs lg:col-span-3">
          <div className="mb-4">
            <h2 className="text-base font-bold text-[var(--ink)]">Tickets by Department</h2>
          </div>
          <div className="h-72">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: 'var(--ink-muted)' }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: 'var(--ink-muted)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--white)',
                      border: '1px solid var(--border)',
                      borderRadius: '0.5rem',
                      fontSize: '0.8125rem',
                    }}
                  />
                  <Bar dataKey="count" fill="var(--primary-blue)" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <p className="text-sm text-[var(--ink-muted)]">No department data yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Status breakdown */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs lg:col-span-2">
          <div className="mb-4">
            <h2 className="text-base font-bold text-[var(--ink)]">By Status</h2>
          </div>
          <ul className="space-y-2.5">
            {Object.entries(data.byStatus).map(([status, count]) => (
              <li key={status} className="flex items-center justify-between text-sm">
                <StatusBadge status={status as never} />
                <span className="font-bold tabular-nums text-[var(--ink)]">
                  {count}
                </span>
              </li>
            ))}
            {!Object.keys(data.byStatus).length && (
              <li className="text-sm text-[var(--ink-muted)]">
                No tickets yet.
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Recent tickets */}
      <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--white)] shadow-xs">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 className="text-base font-bold text-[var(--ink)]">Recent Tickets</h2>
          <RouterLink
            to="/admin/tickets"
            className="text-xs font-semibold text-[var(--primary-blue)] hover:underline"
          >
            View all →
          </RouterLink>
        </div>
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-[var(--primary-blue)] text-white/90 text-xs font-bold uppercase tracking-wider">
              <th className="px-5 py-3">Code</th>
              <th className="px-5 py-3">Department</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Assignee</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {data.recent.map((t) => (
              <tr key={t._id} className="transition-colors hover:bg-[var(--primary-blue-light)]">
                <td className="px-5 py-3.5">
                  <Link
                    to={`/admin/tickets/${t._id}`}
                    className="font-bold text-[var(--primary-blue)] hover:underline"
                  >
                    {t.ticketCode}
                  </Link>
                </td>
                <td className="px-5 py-3.5 text-[var(--ink-muted)]">{getName(t.department)}</td>
                <td className="px-5 py-3.5"><StatusBadge status={t.status} /></td>
                <td className="px-5 py-3.5 text-[var(--ink-muted)]">{getName(t.assignedTo, '—')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
