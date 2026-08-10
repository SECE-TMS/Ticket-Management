import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Ticket } from 'lucide-react'
import { dashboardService } from '../../services/dashboardService'
import { KpiCard, PageHeader } from '../../components/common/KpiCard'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { StatusBadge } from '../../components/common/Badge'
import { useToast } from '../../context/ToastContext'
import { useAppSelector } from '../../store/hooks'
import { getErrorMessage } from '../../lib/utils'
import type { EmployeeDashboard } from '../../types'
import { getName } from '../../types'

export function EmployeeDashboard() {
  const toast = useToast()
  const user = useAppSelector((s) => s.auth.user)
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
    <div className="animate-fade-in">
      {/* Welcome greeting */}
      <div
        className="mb-6 rounded-xl p-5"
        style={{
          background: 'linear-gradient(135deg, var(--primary-blue-deeper), var(--primary-blue))',
          color: 'var(--white)',
        }}
      >
        <p className="text-sm font-medium opacity-80">Welcome back 👋</p>
        <p className="mt-1 text-xl font-bold">{user?.name ?? 'Employee'}</p>
        <p className="mt-0.5 text-sm opacity-70">
          Here's your work summary for today.
        </p>
      </div>

      <PageHeader
        title="My Dashboard"
        description="Your assigned work and personal resolution metrics."
        actions={
          <Link to="/employee/tickets" className="btn btn-primary btn-sm">
            My Tickets
          </Link>
        }
      />

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Open" value={data.totals.open} icon={Ticket} accent="blue" />
        <KpiCard label="Overdue" value={data.totals.overdue} icon={AlertTriangle} accent="danger" />
        <KpiCard label="Resolved" value={data.totals.resolved} icon={CheckCircle2} accent="success" />
      </div>

      {/* Details grid */}
      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        {/* Status breakdown */}
        <div className="panel p-5 lg:col-span-2">
          <h2 className="section-title mb-4">By Status</h2>
          <ul className="space-y-3">
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
                No assigned tickets yet.
              </li>
            )}
          </ul>
        </div>

        {/* Recent assignments */}
        <div className="panel overflow-x-auto lg:col-span-3">
          <div className="section-header">
            <h2 className="section-title">Recent Assignments</h2>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Department</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recent.map((t) => (
                <tr key={t._id}>
                  <td>
                    <Link
                      to={`/employee/tickets/${t._id}`}
                      className="font-semibold hover:underline"
                      style={{ color: 'var(--primary-blue)' }}
                    >
                      {t.ticketCode}
                    </Link>
                  </td>
                  <td style={{ color: 'var(--ink-muted)' }}>{getName(t.department)}</td>
                  <td>
                    <StatusBadge status={t.status} />
                  </td>
                </tr>
              ))}
              {!data.recent.length && (
                <tr>
                  <td colSpan={3}>
                    <p className="py-6 text-center text-sm" style={{ color: 'var(--ink-muted)' }}>
                      No recent assignments.
                    </p>
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
