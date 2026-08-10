import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Building2,
  Ticket,
  Users,
} from 'lucide-react'
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
        title="Admin dashboard"
        description="Facility-wide ticket health and staffing overview."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/tickets"
              className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-teal-700"
            >
              Manage tickets
            </Link>
            <Link
              to="/admin/departments"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-navy hover:bg-slate-50"
            >
              Departments
            </Link>
            <Link
              to="/admin/users"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-navy hover:bg-slate-50"
            >
              Users
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Total tickets" value={data.totals.tickets} icon={Ticket} />
        <KpiCard label="Open" value={data.totals.open} icon={Ticket} />
        <KpiCard label="Overdue" value={data.totals.overdue} icon={AlertTriangle} />
        <KpiCard label="Departments" value={data.totals.departments} icon={Building2} />
        <KpiCard label="Active staff" value={data.totals.users} icon={Users} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <div className="panel p-5 lg:col-span-3">
          <h2 className="font-display text-lg font-semibold text-navy">
            Tickets by department
          </h2>
          <div className="mt-4 h-72">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-500">No distribution data yet.</p>
            )}
          </div>
        </div>

        <div className="panel p-5 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold text-navy">By status</h2>
          <ul className="mt-4 space-y-2">
            {Object.entries(data.byStatus).map(([status, count]) => (
              <li key={status} className="flex items-center justify-between text-sm">
                <StatusBadge status={status as never} />
                <span className="font-semibold text-navy">{count}</span>
              </li>
            ))}
            {!Object.keys(data.byStatus).length && (
              <li className="text-sm text-slate-500">No tickets yet.</li>
            )}
          </ul>
        </div>
      </div>

      <div className="panel mt-6 overflow-x-auto">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-navy">Recent tickets</h2>
        </div>
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs tracking-wide text-slate-500 uppercase">
            <tr>
              <th className="px-5 py-3">Code</th>
              <th className="px-5 py-3">Dept</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Assignee</th>
            </tr>
          </thead>
          <tbody>
            {data.recent.map((t) => (
              <tr key={t._id} className="border-t border-slate-50">
                <td className="px-5 py-3">
                  <Link to={`/admin/tickets/${t._id}`} className="font-medium text-accent hover:underline">
                    {t.ticketCode}
                  </Link>
                </td>
                <td className="px-5 py-3">{getName(t.department)}</td>
                <td className="px-5 py-3">
                  <StatusBadge status={t.status} />
                </td>
                <td className="px-5 py-3">{getName(t.assignedTo, '—')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
