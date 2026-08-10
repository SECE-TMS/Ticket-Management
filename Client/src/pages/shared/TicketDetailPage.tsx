import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
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
      <div className="panel p-8 text-center">
        <p className="text-slate-600">Ticket not found.</p>
        <Link to={backTo} className="mt-4 inline-block text-accent hover:underline">
          Back to list
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
    <div>
      <Link
        to={backTo}
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-navy"
      >
        <ArrowLeft size={16} /> Back to tickets
      </Link>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy sm:text-3xl">
            {ticket.ticketCode}
          </h1>
          <p className="mt-1 text-sm text-slate-600">{ticket.complaintType}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {canAssign && (
          <Button type="button" onClick={() => setAssignOpen(true)}>
            Assign
          </Button>
        )}
        {canClose && (
          <Button
            type="button"
            variant="secondary"
            loading={actionLoading}
            onClick={() =>
              void run(async () => {
                await ticketService.close(ticket._id)
              }, 'Ticket closed')
            }
          >
            Close
          </Button>
        )}
        {canReopen && (
          <Button
            type="button"
            variant="outline"
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
            type="button"
            loading={actionLoading}
            onClick={() =>
              void run(async () => {
                await ticketService.updateStatus(ticket._id, { status: 'accepted' })
              }, 'Ticket accepted')
            }
          >
            Accept
          </Button>
        )}
        {canStart && (
          <Button
            type="button"
            loading={actionLoading}
            onClick={() =>
              void run(async () => {
                await ticketService.updateStatus(ticket._id, { status: 'in_progress' })
              }, 'Marked in progress')
            }
          >
            Start work
          </Button>
        )}
        {canResolve && (
          <Button type="button" variant="secondary" onClick={() => setResolveOpen(true)}>
            Resolve
          </Button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <div className="panel p-5">
            <h2 className="font-display text-lg font-semibold text-navy">Details</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
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
            <p className="mt-4 text-sm leading-relaxed text-slate-700">{ticket.description}</p>

            {ticket.userAttachment?.url && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium tracking-wide text-slate-500 uppercase">
                  Requester attachment
                </p>
                {ticket.userAttachment.type === 'image' ? (
                  <img
                    src={ticket.userAttachment.url}
                    alt="Attachment"
                    className="max-h-64 rounded-lg border border-slate-100"
                  />
                ) : (
                  <audio controls src={ticket.userAttachment.url} className="w-full" />
                )}
              </div>
            )}

            {ticket.resolution?.remarks && (
              <div className="mt-4 rounded-lg bg-teal-50/70 p-3 text-sm">
                <p className="font-medium text-teal-900">Resolution</p>
                <p className="mt-1 text-teal-900/80">{ticket.resolution.remarks}</p>
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

          <div className="panel p-5">
            <h2 className="font-display text-lg font-semibold text-navy">Add comment</h2>
            <form
              className="mt-3 flex flex-col gap-2 sm:flex-row"
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
                placeholder="Internal note…"
                className="h-10 flex-1 rounded-lg border border-slate-200 px-3 outline-none focus:border-accent"
              />
              <Button type="submit" loading={actionLoading}>
                Post
              </Button>
            </form>
            {!!ticket.comments?.length && (
              <ul className="mt-4 space-y-3">
                {ticket.comments.map((c, idx) => (
                  <li key={c._id || idx} className="rounded-lg bg-surface px-3 py-2 text-sm">
                    <div className="flex justify-between gap-2 text-xs text-slate-500">
                      <span>{getName(c.author, 'Staff')}</span>
                      <span>{format(new Date(c.createdAt), 'dd MMM, HH:mm')}</span>
                    </div>
                    <p className="mt-1 text-slate-700">{c.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="panel p-5 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold text-navy">Timeline</h2>
          <div className="mt-4">
            <TicketTimeline activities={activities} />
          </div>
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-navy">{value}</dd>
    </div>
  )
}
