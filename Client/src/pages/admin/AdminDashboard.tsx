import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../lib/utils'
import type { AdminDashboard } from '../../types'
import { getName } from '../../types'
import { Link as RouterLink } from 'react-router-dom'

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
    <div className="animate-fade-in">
      <PageHeader
        title="Admin Dashboard"
        description="Facility-wide ticket health and staffing overview."
        actions={
          <>
            <Link
              to="/admin/tickets"
              className="btn btn-primary btn-sm"
            >
              Manage Tickets
            </Link>
            <Link
              to="/admin/departments"
              className="btn btn-outline btn-sm"
            >
              Departments
            </Link>
            <Link
              to="/admin/users"
              className="btn btn-outline btn-sm"
            >
              Users
            </Link>
          </>
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
        <div className="panel p-5 lg:col-span-3">
          <div className="section-header px-0 py-0 mb-4" style={{ border: 'none' }}>
            <h2 className="section-title">Tickets by Department</h2>
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
              <div className="empty-state h-full">
                <p className="empty-state-desc">No department data yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Status breakdown */}
        <div className="panel p-5 lg:col-span-2">
          <div className="mb-4">
            <h2 className="section-title">By Status</h2>
          </div>
          <ul className="space-y-2.5">
            {Object.entries(data.byStatus).map(([status, count]) => (
              <li key={status} className="flex items-center justify-between text-sm">
                <StatusBadge status={status as never} />
                <span className="font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
                  {count}
                </span>
              </li>
            ))}
            {!Object.keys(data.byStatus).length && (
              <li className="text-sm" style={{ color: 'var(--ink-muted)' }}>
                No tickets yet.
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Recent tickets */}
      <div className="panel mt-6 overflow-x-auto">
        <div className="section-header">
          <h2 className="section-title">Recent Tickets</h2>
          <RouterLink
            to="/admin/tickets"
            className="text-xs font-semibold hover:underline"
            style={{ color: 'var(--primary-blue)' }}
          >
            View all →
          </RouterLink>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Department</th>
              <th>Status</th>
              <th>Assignee</th>
            </tr>
          </thead>
          <tbody>
            {data.recent.map((t) => (
              <tr key={t._id}>
                <td>
                  <Link
                    to={`/admin/tickets/${t._id}`}
                    className="font-semibold hover:underline"
                    style={{ color: 'var(--primary-blue)' }}
                  >
                    {t.ticketCode}
                  </Link>
                </td>
                <td style={{ color: 'var(--ink-muted)' }}>{getName(t.department)}</td>
                <td><StatusBadge status={t.status} /></td>
                <td style={{ color: 'var(--ink-muted)' }}>{getName(t.assignedTo, '—')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
