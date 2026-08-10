import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Ticket } from 'lucide-react'
import { dashboardService } from '../../services/dashboardService'
import { KpiCard, PageHeader } from '../../components/common/KpiCard'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { StatusBadge } from '../../components/common/Badge'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../lib/utils'
import type { EmployeeDashboard } from '../../types'
import { getName } from '../../types'

export function EmployeeDashboard() {
  const toast = useToast()
  const [data, setData] = useState<EmployeeDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        setData(await dashboardService.employee())
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
        title="My dashboard"
        description="Your assigned work and personal resolution metrics."
        actions={
          <Link
            to="/employee/tickets"
            className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            My tickets
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Open" value={data.totals.open} icon={Ticket} />
        <KpiCard label="Overdue" value={data.totals.overdue} icon={AlertTriangle} />
        <KpiCard label="Resolved" value={data.totals.resolved} icon={CheckCircle2} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
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
              <li className="text-sm text-slate-500">No assigned tickets yet.</li>
            )}
          </ul>
        </div>

        <div className="panel overflow-x-auto lg:col-span-3">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-display text-lg font-semibold text-navy">Recent assignments</h2>
          </div>
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Dept</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recent.map((t) => (
                <tr key={t._id} className="border-t border-slate-50">
                  <td className="px-5 py-3">
                    <Link
                      to={`/employee/tickets/${t._id}`}
                      className="font-medium text-accent hover:underline"
                    >
                      {t.ticketCode}
                    </Link>
                  </td>
                  <td className="px-5 py-3">{getName(t.department)}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={t.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
