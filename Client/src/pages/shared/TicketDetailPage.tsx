import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeft, MessageSquare } from 'lucide-react'
import { ticketService } from '../../services/ticketService'
import { userService } from '../../services/userService'
import { Button } from '../../components/common/Button'
import { PriorityBadge, StatusBadge } from '../../components/common/Badge'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { TicketTimeline } from '../../components/tickets/TicketTimeline'
import { AssignModal } from '../../components/tickets/AssignModal'
import { ResolveModal } from '../../components/tickets/ResolveModal'
import { useToast } from '../../context/ToastContext'
import { useAppSelector } from '../../store/hooks'
import { getErrorMessage } from '../../lib/utils'
import type { Activity, Ticket, User } from '../../types'
import { getId, getName } from '../../types'

interface TicketDetailPageProps {
  backTo: string
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--ink-muted)' }}>
        {label}
      </dt>
      <dd className="mt-1 font-medium text-sm" style={{ color: 'var(--ink)' }}>
        {value}
      </dd>
    </div>
  )
}

function getInitials(name?: string) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export function TicketDetailPage({ backTo }: TicketDetailPageProps) {
  const { id } = useParams<{ id: string }>()
  const toast = useToast()
  const user = useAppSelector((s) => s.auth.user)
  const role = user?.role

  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [employees, setEmployees] = useState<User[]>([])
  const [assignOpen, setAssignOpen] = useState(false)
  const [resolveOpen, setResolveOpen] = useState(false)
  const [comment, setComment] = useState('')

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await ticketService.getById(id)
      setTicket(data.ticket)
      setActivities(data.activities)

      if (role === 'admin' || role === 'manager') {
        const deptId = getId(data.ticket.department)
        if (deptId) {
          const emps = await userService.listByDepartment(deptId)
          setEmployees(emps.filter((e) => e.role === 'employee' && e.isActive))
        }
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load ticket'))
    } finally {
      setLoading(false)
    }
  }, [id, role, toast])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) return <PageLoader />
  if (!ticket) {
    return (
      <div className="panel p-10 text-center">
        <p className="font-medium" style={{ color: 'var(--ink)' }}>Ticket not found.</p>
        <Link
          to={backTo}
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold hover:underline"
          style={{ color: 'var(--primary-blue)' }}
        >
          <ArrowLeft size={14} /> Back to tickets
        </Link>
      </div>
    )
  }

  const canAssign =
    (role === 'admin' || role === 'manager') &&
    ['new', 'reopened', 'assigned'].includes(ticket.status)
  const canClose = (role === 'admin' || role === 'manager') && ticket.status === 'resolved'
  const canReopen =
    (role === 'admin' || role === 'manager') &&
    ['resolved', 'closed'].includes(ticket.status)
  const canAccept =
    role === 'employee' && (ticket.status === 'assigned' || ticket.status === 'reopened')
  const canStart = role === 'employee' && ticket.status === 'accepted'
  const canResolve =
    role === 'employee' &&
    ['assigned', 'accepted', 'in_progress', 'reopened'].includes(ticket.status)

  const run = async (fn: () => Promise<void>, success: string) => {
    setActionLoading(true)
    try {
      await fn()
      toast.success(success)
      await load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Back link */}
      <Link
        to={backTo}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium transition hover:opacity-80"
        style={{ color: 'var(--primary-blue)' }}
      >
        <ArrowLeft size={15} />
        Back to tickets
      </Link>

      {/* Ticket header banner */}
      <div
        className="mb-5 rounded-xl p-5"
        style={{ background: 'var(--primary-blue)', color: 'var(--white)' }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(255 255 255 / 0.65)' }}>
              Ticket
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">
              {ticket.ticketCode}
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'rgb(255 255 255 / 0.75)' }}>
              {ticket.complaintType}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {(canAssign || canClose || canReopen || canAccept || canStart || canResolve) && (
        <div
          className="mb-5 flex flex-wrap gap-2 rounded-xl p-4"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
        >
          <p className="w-full text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--ink-muted)' }}>
            Actions
          </p>
          {canAssign && (
            <Button type="button" id="action-assign" onClick={() => setAssignOpen(true)}>
              Assign Ticket
            </Button>
          )}
          {canClose && (
            <Button
              id="action-close"
              type="button"
              variant="outline"
              loading={actionLoading}
              onClick={() =>
                void run(async () => {
                  await ticketService.close(ticket._id)
                }, 'Ticket closed')
              }
            >
              Close Ticket
            </Button>
          )}
          {canReopen && (
            <Button
              id="action-reopen"
              type="button"
              variant="ghost"
              loading={actionLoading}
              onClick={() =>
                void run(async () => {
                  await ticketService.reopen(ticket._id, 'Reopened by manager')
                }, 'Ticket reopened')
              }
            >
              Reopen
            </Button>
          )}
          {canAccept && (
            <Button
              id="action-accept"
              type="button"
              loading={actionLoading}
              onClick={() =>
                void run(async () => {
                  await ticketService.updateStatus(ticket._id, { status: 'accepted' })
                }, 'Ticket accepted')
              }
            >
              Accept Ticket
            </Button>
          )}
          {canStart && (
            <Button
              id="action-start"
              type="button"
              loading={actionLoading}
              onClick={() =>
                void run(async () => {
                  await ticketService.updateStatus(ticket._id, { status: 'in_progress' })
                }, 'Marked in progress')
              }
            >
              Start Work
            </Button>
          )}
          {canResolve && (
            <Button
              id="action-resolve"
              type="button"
              variant="secondary"
              onClick={() => setResolveOpen(true)}
            >
              Mark Resolved
            </Button>
          )}
        </div>
      )}

      {/* Main content grid */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Left column */}
        <div className="space-y-4 lg:col-span-3">
          {/* Details */}
          <div className="panel p-5">
            <h2 className="section-title mb-4">Ticket Details</h2>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <Info label="Requester" value={ticket.requester.name} />
              <Info label="Mobile" value={ticket.requester.mobile} />
              <Info label="Department" value={getName(ticket.department)} />
              <Info label="Assignee" value={getName(ticket.assignedTo, 'Unassigned')} />
              <Info
                label="Created"
                value={format(new Date(ticket.createdAt), 'dd MMM yyyy, HH:mm')}
              />
              <Info
                label="Expected by"
                value={
                  ticket.expectedResolutionAt
                    ? format(new Date(ticket.expectedResolutionAt), 'dd MMM yyyy, HH:mm')
                    : '—'
                }
              />
            </dl>

            {ticket.description && (
              <div
                className="mt-5 rounded-lg p-4 text-sm leading-relaxed"
                style={{ background: 'var(--surface)', color: 'var(--ink)' }}
              >
                {ticket.description}
              </div>
            )}

            {ticket.userAttachment?.url && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--ink-muted)' }}>
                  Requester attachment
                </p>
                {ticket.userAttachment.type === 'image' ? (
                  <img
                    src={ticket.userAttachment.url}
                    alt="Attachment"
                    className="max-h-64 rounded-lg"
                    style={{ border: '1px solid var(--border)' }}
                  />
                ) : (
                  <audio controls src={ticket.userAttachment.url} className="w-full" />
                )}
              </div>
            )}

            {ticket.resolution?.remarks && (
              <div
                className="mt-5 rounded-lg p-4 text-sm"
                style={{
                  background: 'var(--success-light)',
                  border: '1px solid rgb(22 163 74 / 0.2)',
                }}
              >
                <p className="font-semibold" style={{ color: 'var(--success)' }}>
                  ✓ Resolution
                </p>
                <p className="mt-1" style={{ color: 'var(--ink)' }}>
                  {ticket.resolution.remarks}
                </p>
                {ticket.resolution.attachment?.url && (
                  <div className="mt-2">
                    {ticket.resolution.attachment.type === 'image' ? (
                      <img
                        src={ticket.resolution.attachment.url}
                        alt="Proof"
                        className="max-h-48 rounded-lg"
                      />
                    ) : (
                      <audio controls src={ticket.resolution.attachment.url} className="w-full" />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="panel p-5">
            <h2 className="section-title mb-4 flex items-center gap-2">
              <MessageSquare size={16} style={{ color: 'var(--primary-blue)' }} />
              Comments
            </h2>
            <form
              className="flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault()
                if (!comment.trim()) return
                void run(async () => {
                  await ticketService.comment(ticket._id, comment.trim())
                  setComment('')
                }, 'Comment added')
              }}
            >
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add an internal note…"
                className="input-field flex-1"
                id="ticket-comment-input"
              />
              <Button type="submit" loading={actionLoading} size="md">
                Post
              </Button>
            </form>

            {!!ticket.comments?.length && (
              <ul className="mt-4 space-y-3">
                {ticket.comments.map((c, idx) => (
                  <li
                    key={c._id || idx}
                    className="rounded-lg p-3 text-sm"
                    style={{ background: 'var(--surface)' }}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <div
                        className="avatar avatar-sm"
                        style={{ background: 'var(--primary-blue-light)', color: 'var(--primary-blue)' }}
                      >
                        {getInitials(getName(c.author, 'S'))}
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--ink)' }}>
                          {getName(c.author, 'Staff')}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                          {format(new Date(c.createdAt), 'dd MMM, HH:mm')}
                        </p>
                      </div>
                    </div>
                    <p style={{ color: 'var(--ink)' }}>{c.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right column — Timeline */}
        <div className="panel p-5 lg:col-span-2">
          <h2 className="section-title mb-4">Activity Timeline</h2>
          <TicketTimeline activities={activities} />
        </div>
      </div>

      <AssignModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        employees={employees}
        expectedResolutionAt={ticket.expectedResolutionAt}
        initialPriority={ticket.priority}
        loading={actionLoading}
        onSubmit={async (payload) => {
          await run(async () => {
            await ticketService.assign(ticket._id, payload)
            setAssignOpen(false)
          }, 'Ticket assigned')
        }}
      />

      <ResolveModal
        open={resolveOpen}
        onClose={() => setResolveOpen(false)}
        loading={actionLoading}
        onSubmit={async ({ remarks, file }) => {
          await run(async () => {
            const fd = new FormData()
            fd.append('remarks', remarks)
            if (file) fd.append('attachment', file)
            await ticketService.resolve(ticket._id, fd)
            setResolveOpen(false)
          }, 'Ticket resolved')
        }}
      />
    </div>
  )
}
