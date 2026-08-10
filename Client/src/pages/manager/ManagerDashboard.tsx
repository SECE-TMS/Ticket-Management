import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Ticket, UserRound, Users } from 'lucide-react'
import { dashboardService } from '../../services/dashboardService'
import { KpiCard, PageHeader } from '../../components/common/KpiCard'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { StatusBadge } from '../../components/common/Badge'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../lib/utils'
import type { ManagerDashboard } from '../../types'
import { getName } from '../../types'

export function ManagerDashboard() {
  const toast = useToast()
  const [data, setData] = useState<ManagerDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        setData(await dashboardService.manager())
      } catch (err) {
        toast.error(getErrorMessage(err, 'Failed to load dashboard'))
      } finally {
        setLoading(false)
      }
    })()
  }, [toast])

  if (loading) return <PageLoader />
  if (!data) return null

  return (
    <div>
      <PageHeader
        title="Manager dashboard"
        description="Department workload, unassigned requests, and team capacity."
        actions={
          <div className="flex gap-2">
            <Link
              to="/manager/tickets"
              className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-teal-700"
            >
              View tickets
            </Link>
            <Link
              to="/manager/employees"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-navy"
            >
              Employees
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Open tickets" value={data.totals.open} icon={Ticket} />
        <KpiCard label="Unassigned" value={data.totals.unassigned} icon={UserRound} />
        <KpiCard label="Overdue" value={data.totals.overdue} icon={AlertTriangle} />
        <KpiCard label="Employees" value={data.totals.employees} icon={Users} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="panel p-5">
          <h2 className="font-display text-lg font-semibold text-navy">Team workload</h2>
          <ul className="mt-4 space-y-2">
            {data.workload.map((w) => (
              <li
                key={w.employeeId}
                className="flex items-center justify-between rounded-lg bg-surface px-3 py-2 text-sm"
              >
                <span className="font-medium text-navy">{w.name}</span>
                <span className="text-slate-600">{w.openCount} open</span>
              </li>
            ))}
            {!data.workload.length && (
              <li className="text-sm text-slate-500">No open assigned work.</li>
            )}
          </ul>
        </div>

        <div className="panel p-5">
          <h2 className="font-display text-lg font-semibold text-navy">By status</h2>
          <ul className="mt-4 space-y-2">
            {Object.entries(data.byStatus).map(([status, count]) => (
              <li key={status} className="flex items-center justify-between text-sm">
                <StatusBadge status={status as never} />
                <span className="font-semibold text-navy">{count}</span>
              </li>
            ))}
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
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Assignee</th>
            </tr>
          </thead>
          <tbody>
            {data.recent.map((t) => (
              <tr key={t._id} className="border-t border-slate-50">
                <td className="px-5 py-3">
                  <Link
                    to={`/manager/tickets/${t._id}`}
                    className="font-medium text-accent hover:underline"
                  >
                    {t.ticketCode}
                  </Link>
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={t.status} />
                </td>
                <td className="px-5 py-3">{getName(t.assignedTo, 'Unassigned')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
