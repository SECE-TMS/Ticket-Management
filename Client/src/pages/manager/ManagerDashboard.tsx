import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, Ticket, UserRound, Users } from 'lucide-react'
import { dashboardService } from '../../services/dashboardService'
import { KpiCard, PageHeader } from '../../components/common/KpiCard'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { StatusBadge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../lib/utils'
import type { ManagerDashboard } from '../../types'
import { getName } from '../../types'

export function ManagerDashboard() {
  const toast = useToast()
  const navigate = useNavigate()
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

  const maxOpen = Math.max(...data.workload.map((w) => w.openCount), 1)

  return (
    <div>
      <PageHeader
        title="Manager Dashboard"
        description="Department workload, unassigned requests, and team capacity."
        actions={
          <div className="flex gap-2">
            <Link to="/manager/tickets">
              <Button size="sm" variant="primary">View Tickets</Button>
            </Link>
            <Link to="/manager/employees">
              <Button size="sm" variant="outline">Employees</Button>
            </Link>
          </div>
        }
      />

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Open Tickets" value={data.totals.open} icon={Ticket} accent="blue" />
        <KpiCard label="Unassigned" value={data.totals.unassigned} icon={UserRound} accent="gold" />
        <KpiCard label="Overdue" value={data.totals.overdue} icon={AlertTriangle} accent="danger" />
        <KpiCard label="Employees" value={data.totals.employees} icon={Users} accent="success" />
      </div>

      {/* Workload + Status row */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Team workload with progress bars */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs">
          <h2 className="text-base font-bold text-[var(--ink)] mb-4">Team Workload</h2>
          {data.workload.length ? (
            <ul className="space-y-4">
              {data.workload.map((w) => (
                <li key={w.employeeId}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-semibold text-[var(--ink)]">
                      {w.name}
                    </span>
                    <span className="font-bold tabular-nums text-[var(--primary-blue)]">
                      {w.openCount} open
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        w.openCount === maxOpen
                          ? 'bg-[var(--danger)]'
                          : 'bg-[var(--primary-blue)]'
                      }`}
                      style={{ width: `${Math.round((w.openCount / maxOpen) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--ink-muted)]">
              No open assigned work yet.
            </p>
          )}
        </div>

        {/* Status breakdown */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs">
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
                No tickets yet.
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Recent tickets */}
      <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--white)] shadow-xs">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 sm:px-5 py-4">
          <h2 className="text-base font-bold text-[var(--ink)]">Recent Tickets</h2>
          <Link
            to="/manager/tickets"
            className="text-xs font-semibold text-[var(--primary-blue)] hover:underline"
          >
            View all →
          </Link>
        </div>

        {/* Mobile Cards (< md) */}
        <div className="flex flex-col divide-y divide-[var(--border)] md:hidden">
          {data.recent.map((t) => (
            <div
              key={t._id}
              onClick={() => navigate(`/manager/tickets/${t._id}`)}
              className="p-4 hover:bg-[var(--primary-blue-light)] transition-colors cursor-pointer space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[var(--primary-blue)]">{t.ticketCode}</span>
                <StatusBadge status={t.status} />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--ink)]">{t.requester?.name || 'Valued User'}</p>
                <p className="text-xs font-semibold text-[var(--ink)] mt-0.5">{t.complaintType}</p>
              </div>
              <div className="text-[11px] text-[var(--ink-muted)] pt-1">
                Assignee: <span className="font-semibold text-[var(--primary-blue)]">{getName(t.assignedTo, 'Unassigned')}</span>
              </div>
            </div>
          ))}
          {!data.recent.length && (
            <div className="p-6 text-center text-xs text-[var(--ink-muted)]">No recent tickets logged.</div>
          )}
        </div>

        {/* Desktop Data Table (≥ md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-[var(--primary-blue)] text-white/90 text-xs font-bold uppercase tracking-wider">
                <th className="px-5 py-3">Requester &amp; Ticket ID</th>
                <th className="px-5 py-3">Complaint</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Assignee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {data.recent.map((t) => (
                <tr
                  key={t._id}
                  onClick={() => navigate(`/manager/tickets/${t._id}`)}
                  className="cursor-pointer transition-colors hover:bg-[var(--primary-blue-light)]"
                >
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-[var(--ink)]">
                      {t.requester?.name || 'Valued User'}
                    </div>
                    <Link
                      to={`/manager/tickets/${t._id}`}
                      className="font-mono text-xs font-bold text-[var(--primary-blue)] hover:underline block mt-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {t.ticketCode}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 font-medium text-[var(--ink)]">
                    {t.complaintType}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-5 py-3.5 text-[var(--ink-muted)]">
                    {getName(t.assignedTo, 'Unassigned')}
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
