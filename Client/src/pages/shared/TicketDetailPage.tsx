import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeft, Camera, CheckCircle2, Clock, ExternalLink, MessageSquare, Volume2, X } from 'lucide-react'
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
import { getErrorMessage, getAttachmentUrl } from '../../lib/utils'
import type { Activity, Ticket, User } from '../../types'
import { getId, getName } from '../../types'

interface TicketDetailPageProps {
  backTo: string
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
        {label}
      </dt>
      <dd className="mt-1 font-semibold text-sm text-[var(--ink)]">
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
  const [activeImageModal, setActiveImageModal] = useState<string | null>(null)

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
      <div className="rounded-xl border border-[var(--border)] bg-[var(--white)] p-10 text-center shadow-xs">
        <p className="font-semibold text-[var(--ink)]">Ticket not found.</p>
        <Link
          to={backTo}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--primary-blue)] hover:underline"
        >
          <ArrowLeft size={14} /> Back to tickets
        </Link>
      </div>
    )
  }

  const canAssign =
    (role === 'admin' || role === 'manager') &&
    ['new', 'reopened', 'assigned'].includes(ticket.status)
  const canClose =
    (role === 'admin' || role === 'manager') && ticket.status !== 'closed'
  const canReopen =
    (role === 'admin' || role === 'manager') &&
    ['resolved', 'closed'].includes(ticket.status)
  const canAccept =
    role === 'employee' && (ticket.status === 'assigned' || ticket.status === 'reopened')
  const canStart = role === 'employee' && ticket.status === 'accepted'
  const canResolve =
    ['admin', 'manager', 'employee'].includes(role || '') &&
    ['new', 'assigned', 'accepted', 'in_progress', 'reopened'].includes(ticket.status)

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
      {/* Back link */}
      <Link
        to={backTo}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--primary-blue)] hover:underline"
      >
        <ArrowLeft size={15} />
        Back to tickets
      </Link>

      {/* Ticket header banner */}
      <div className="mb-5 rounded-2xl bg-[var(--primary-blue)] p-4 sm:p-6 text-[var(--white)] shadow-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/65">
              Ticket
            </p>
            <h1 className="mt-1 font-display text-xl sm:text-2xl font-bold tracking-tight">
              {ticket.ticketCode}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-white/75">
              {ticket.complaintType}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {(canAssign || canClose || canReopen || canAccept || canStart || canResolve) && (
        <div className="mb-5 flex flex-col sm:flex-row sm:flex-wrap gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <p className="w-full text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)] mb-1">
            Actions
          </p>
          {canAssign && (
            <Button type="button" id="action-assign" onClick={() => setAssignOpen(true)} className="w-full sm:w-auto font-bold">
              Assign Ticket
            </Button>
          )}
          {canAccept && (
            <Button
              id="action-accept"
              type="button"
              loading={actionLoading}
              className="w-full sm:w-auto font-bold"
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
              className="w-full sm:w-auto font-bold"
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
              className="w-full sm:w-auto font-bold"
              onClick={() => setResolveOpen(true)}
            >
              Mark Resolved
            </Button>
          )}
          {canReopen && (
            <Button
              id="action-reopen"
              type="button"
              variant="ghost"
              loading={actionLoading}
              className="w-full sm:w-auto font-bold"
              onClick={() =>
                void run(async () => {
                  await ticketService.reopen(ticket._id, 'Reopened by manager')
                }, 'Ticket reopened')
              }
            >
              Reopen
            </Button>
          )}
          {canClose && (
            <Button
              id="action-close"
              type="button"
              variant="outline"
              loading={actionLoading}
              className="w-full sm:w-auto font-bold"
              onClick={() =>
                void run(async () => {
                  await ticketService.close(ticket._id)
                }, 'Ticket closed')
              }
            >
              Close Ticket
            </Button>
          )}
        </div>
      )}

      {/* Main content grid */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Left column */}
        <div className="space-y-4 lg:col-span-3">
          {/* Details */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs">
            <h2 className="text-base font-bold text-[var(--ink)] mb-4">Ticket Details</h2>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <Info label="Requester" value={ticket.requester.name} />
              <Info label="Mobile" value={ticket.requester.mobile} />
              {ticket.requester.userType && (
                <Info
                  label="Role & Roll No"
                  value={`${ticket.requester.userType.toUpperCase()}${ticket.requester.rollNumber ? ` (${ticket.requester.rollNumber})` : ''}`}
                />
              )}
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
              <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm leading-relaxed text-[var(--ink)]">
                {ticket.description}
              </div>
            )}

            {/* ── BEFORE & AFTER MEDIA PROOF GALLERY (2-COL GRID) ────────────────── */}
            <div className="mt-6 border-t border-[var(--border)] pt-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)] mb-3 flex items-center gap-2">
                <Camera size={15} className="text-[var(--primary-blue)]" />
                Media Proof &amp; Attachments
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Card 1: Initial Reported Issue Attachment (Before) */}
                <div className="flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary-blue)]">
                        📸 Initial Reported Issue
                      </span>
                      <span className="rounded-full bg-[var(--primary-blue-light)] px-2 py-0.5 text-[10px] font-bold text-[var(--primary-blue)]">
                        Before
                      </span>
                    </div>

                    {(() => {
                      const allAtts = ticket.userAttachments?.length
                        ? ticket.userAttachments
                        : ticket.userAttachment?.url
                        ? [ticket.userAttachment]
                        : []

                      if (!allAtts.length) {
                        return (
                          <div className="flex h-36 flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--white)] p-3 text-center">
                            <Camera size={22} className="mb-1 text-[var(--ink-muted)] opacity-50" />
                            <p className="text-xs font-semibold text-[var(--ink-muted)]">
                              No media attached during submission
                            </p>
                          </div>
                        )
                      }

                      return (
                        <div className="space-y-3">
                          {allAtts.map((att, idx) => (
                            <div key={idx} className="rounded-lg border border-[var(--border)] bg-[var(--white)] p-2">
                              {att.type === 'image' && (
                                <div
                                  className="group relative cursor-pointer overflow-hidden rounded-lg border border-[var(--border)] bg-black/5"
                                  onClick={() => setActiveImageModal(att.url)}
                                >
                                  <img
                                    src={getAttachmentUrl(att.url)}
                                    alt={`Attachment ${idx + 1}`}
                                    className="h-44 w-full object-cover transition-all duration-200 group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-all group-hover:opacity-100">
                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-bold text-[var(--ink)] shadow-md">
                                      <ExternalLink size={13} /> View Photo
                                    </span>
                                  </div>
                                </div>
                              )}
                              {att.type === 'video' && (
                                <div className="overflow-hidden rounded-lg bg-black">
                                  <video controls src={getAttachmentUrl(att.url)} className="w-full max-h-52 rounded-lg object-contain" />
                                </div>
                              )}
                              {att.type === 'audio' && (
                                <div>
                                  <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-[var(--ink)]">
                                    <Volume2 size={15} className="text-[var(--primary-blue)]" />
                                    Voice Note Attachment {allAtts.length > 1 ? `#${idx + 1}` : ''}
                                  </div>
                                  <audio controls src={getAttachmentUrl(att.url)} className="w-full h-10" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                  </div>
                </div>

                {/* Card 2: Technician Resolution Proof Attachment (After) */}
                <div className="flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div>
                    {(() => {
                      const isCompleted = ticket.status === 'resolved' || ticket.status === 'closed' || !!ticket.resolution?.attachment?.url
                      return (
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs font-bold uppercase tracking-wider ${isCompleted ? 'text-[var(--success)]' : 'text-[var(--ink-muted)]'}`}>
                            {isCompleted ? '✅ Completion Proof' : '⏳ Completion Proof'}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isCompleted
                              ? 'bg-[var(--success-light)] text-[var(--success)]'
                              : 'bg-[var(--surface-2)] text-[var(--ink-muted)]'
                          }`}>
                            {isCompleted ? 'After' : 'Pending'}
                          </span>
                        </div>
                      )
                    })()}

                    {ticket.resolution?.attachment?.url ? (
                      ticket.resolution.attachment.type === 'image' ? (
                        <div
                          className="group relative cursor-pointer overflow-hidden rounded-lg border border-green-200 bg-black/5"
                          onClick={() => setActiveImageModal(ticket.resolution!.attachment!.url!)}
                        >
                          <img
                            src={getAttachmentUrl(ticket.resolution.attachment.url)}
                            alt="Completion Resolution Proof"
                            className="h-44 w-full object-cover transition-all duration-200 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-all group-hover:opacity-100">
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-bold text-[var(--ink)] shadow-md">
                              <ExternalLink size={13} /> View Resolution Photo
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-green-200 bg-[var(--white)] p-3">
                          <div className="flex items-center gap-2 mb-2 text-xs font-bold text-[var(--success)]">
                            <Volume2 size={15} /> Technician Audio Proof
                          </div>
                          <audio controls src={getAttachmentUrl(ticket.resolution.attachment.url)} className="w-full h-10" />
                        </div>
                      )
                    ) : (
                      <div className="flex h-36 flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--white)] p-3 text-center">
                        <Clock size={22} className="mb-1 text-[var(--ink-muted)] opacity-50" />
                        <p className="text-xs font-semibold text-[var(--ink-muted)]">
                          {ticket.status === 'resolved' || ticket.status === 'closed'
                            ? 'Resolved without attachment'
                            : 'Pending technician completion proof'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Technician Resolution Remarks Callout */}
            {ticket.resolution?.remarks && (
              <div className="mt-4 rounded-xl border border-[var(--success)]/30 bg-[var(--success-light)] p-4 shadow-xs">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 size={16} className="text-[var(--success)]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--success)]">
                    Technician Resolution Notes
                  </h4>
                </div>
                <p className="text-sm leading-relaxed text-[var(--ink)]">
                  {ticket.resolution.remarks}
                </p>
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs">
            <h2 className="text-base font-bold text-[var(--ink)] mb-4 flex items-center gap-2">
              <MessageSquare size={16} className="text-[var(--primary-blue)]" />
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
                className="h-10 flex-1 rounded-lg border border-[var(--border)] bg-[var(--white)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
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
                    className="rounded-xl bg-[var(--surface)] p-3 text-sm border border-[var(--border)]"
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary-blue-light)] text-[var(--primary-blue)] text-xs font-bold uppercase">
                        {getInitials(getName(c.author, 'S'))}
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-[var(--ink)]">
                          {getName(c.author, 'Staff')}
                        </p>
                        <p className="text-[11px] text-[var(--ink-muted)]">
                          {format(new Date(c.createdAt), 'dd MMM, HH:mm')}
                        </p>
                      </div>
                    </div>
                    <p className="text-[var(--ink)]">{c.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right column — Timeline */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs lg:col-span-2">
          <h2 className="text-base font-bold text-[var(--ink)] mb-4">Activity Timeline</h2>
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

      {/* Lightbox Image Zoom Modal */}
      {activeImageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-fade-in"
          onClick={() => setActiveImageModal(null)}
        >
          <div className="relative max-w-4xl w-full flex flex-col items-center">
            <button
              type="button"
              onClick={() => setActiveImageModal(null)}
              className="absolute -top-10 right-0 inline-flex items-center gap-1 text-sm font-bold text-white hover:text-[var(--gold)] cursor-pointer"
            >
              <X size={20} /> Close
            </button>
            <img
              src={getAttachmentUrl(activeImageModal)}
              alt="Enlarged attachment"
              className="max-h-[80vh] w-auto rounded-2xl shadow-2xl object-contain border border-white/20"
            />
          </div>
        </div>
      )}
    </div>
  )
}
