import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Ticket } from 'lucide-react'
import { dashboardService } from '../../services/dashboardService'
import { KpiCard, PageHeader } from '../../components/common/KpiCard'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { StatusBadge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { useToast } from '../../context/ToastContext'
import { useAppSelector } from '../../store/hooks'
import { getErrorMessage } from '../../lib/utils'
import type { EmployeeDashboard } from '../../types'
import { getName } from '../../types'

export function EmployeeDashboard() {
  const toast = useToast()
  const navigate = useNavigate()
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
    <div>
      {/* Welcome greeting banner */}
      <div className="mb-6 rounded-xl bg-gradient-to-br from-[var(--primary-blue-deeper)] to-[var(--primary-blue)] p-5 text-[var(--white)] shadow-md">
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
          <Link to="/employee/tickets">
            <Button size="sm" variant="primary">My Tickets</Button>
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
        <div className="rounded-xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs lg:col-span-2">
          <h2 className="text-base font-bold text-[var(--ink)] mb-4">By Status</h2>
          <ul className="space-y-3">
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
                No assigned tickets yet.
              </li>
            )}
          </ul>
        </div>

        {/* Recent assignments */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] shadow-xs lg:col-span-3">
          <div className="border-b border-[var(--border)] px-4 sm:px-5 py-4">
            <h2 className="text-base font-bold text-[var(--ink)]">Recent Assignments</h2>
          </div>

          {/* Mobile Cards (< md) */}
          <div className="flex flex-col divide-y divide-[var(--border)] md:hidden">
            {data.recent.map((t) => (
              <div
                key={t._id}
                onClick={() => navigate(`/employee/tickets/${t._id}`)}
                className="p-4 hover:bg-[var(--primary-blue-light)] transition-colors cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[var(--primary-blue)]">{t.ticketCode}</span>
                  <StatusBadge status={t.status} />
                </div>
                <div className="text-xs font-semibold text-[var(--ink)]">{t.complaintType}</div>
                <div className="text-[11px] text-[var(--ink-muted)]">{getName(t.department)}</div>
              </div>
            ))}
            {!data.recent.length && (
              <div className="p-6 text-center text-xs text-[var(--ink-muted)]">No recent assignments.</div>
            )}
          </div>

          {/* Desktop Table (≥ md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-[var(--primary-blue)] text-white/90 text-xs font-bold uppercase tracking-wider">
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {data.recent.map((t) => (
                  <tr
                    key={t._id}
                    onClick={() => navigate(`/employee/tickets/${t._id}`)}
                    className="cursor-pointer transition-colors hover:bg-[var(--primary-blue-light)]"
                  >
                    <td className="px-5 py-3.5">
                      <Link
                        to={`/employee/tickets/${t._id}`}
                        className="font-bold text-[var(--primary-blue)] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {t.ticketCode}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-[var(--ink-muted)]">{getName(t.department)}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={t.status} />
                    </td>
                  </tr>
                ))}
                {!data.recent.length && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-sm text-[var(--ink-muted)]">
                      No recent assignments.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
