import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeft, Camera, CheckCircle2, Clock, ExternalLink, MessageSquare, Volume2, X } from 'lucide-react'
import { ticketService } from '../../services/ticketService'
import { userService } from '../../services/userService'
import { Button } from '../../components/common/Button'
import { Modal } from '../../components/common/Modal'
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
  const [reviewRemarks, setReviewRemarks] = useState('')
  const [reopenOpen, setReopenOpen] = useState(false)
  const [reopenReason, setReopenReason] = useState('')
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
    (role === 'admin' || role === 'manager') && ticket.status !== 'closed' && ticket.status !== 'pending_approval'
  const canReopen =
    (role === 'admin' || role === 'manager') &&
    ['resolved', 'closed', 'pending_approval'].includes(ticket.status)
  const canAccept =
    role === 'employee' && (ticket.status === 'assigned' || ticket.status === 'reopened')
  const canStart = role === 'employee' && ticket.status === 'accepted'
  const canResolve =
    ['admin', 'manager', 'employee'].includes(role || '') &&
    ['new', 'assigned', 'accepted', 'in_progress', 'reopened'].includes(ticket.status)
  // pending_approval → only manager/admin can approve and close
  const canApproveClose =
    (role === 'admin' || role === 'manager') && ticket.status === 'pending_approval'

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
      <div className="mb-5 rounded-xl bg-[var(--primary-blue)] p-5 text-[var(--white)] shadow-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/65">
              Ticket
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">
              {ticket.title || ticket.ticketCode}
            </h1>
            <p className="mt-1 text-sm text-white/75">
              {ticket.title ? `${ticket.ticketCode} • ${ticket.complaintType}` : ticket.complaintType}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {(canAssign || canClose || canReopen || canAccept || canStart || canResolve || canApproveClose) && (
        <div className="mb-5 flex flex-wrap gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <p className="w-full text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
            Actions
          </p>

          {/* Pending Approval Review & Decision Card for Admin / Manager */}
          {ticket.status === 'pending_approval' && (role === 'admin' || role === 'manager') && (
            <div className="w-full rounded-2xl border border-amber-300 bg-amber-50/80 p-4 sm:p-5 shadow-xs">
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0">⏳</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-amber-950 text-sm sm:text-base">
                    Review Resolution &amp; Decision
                  </h3>
                  <p className="text-xs text-amber-800 mt-0.5">
                    The assigned technician completed this ticket. Review their resolution notes and media proof below. You can approve to close, or reject with comments to automatically reopen for rework.
                  </p>

                  {/* Comment input textarea */}
                  <div className="mt-3.5">
                    <label
                      htmlFor="approval-remarks"
                      className="block text-[11px] font-bold uppercase tracking-wider text-amber-900 mb-1"
                    >
                      Reviewer Comments / Instructions
                    </label>
                    <textarea
                      id="approval-remarks"
                      rows={3}
                      value={reviewRemarks}
                      onChange={(e) => setReviewRemarks(e.target.value)}
                      placeholder="Enter comments for approval (optional) or explain why it is rejected and what needs to be fixed (required for reject)..."
                      className="w-full rounded-xl border border-amber-300 bg-[var(--white)] p-3 text-xs sm:text-sm text-[var(--ink)] placeholder:text-amber-800/40 outline-none focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20 shadow-xs"
                    />
                  </div>

                  {/* Decision Action Buttons */}
                  <div className="mt-4 flex flex-wrap items-center gap-2.5">
                    <Button
                      id="action-approve-close"
                      type="button"
                      loading={actionLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs cursor-pointer"
                      onClick={() =>
                        void run(async () => {
                          await ticketService.approveClose(ticket._id, reviewRemarks.trim() || undefined)
                          setReviewRemarks('')
                        }, 'Ticket approved and closed!')
                      }
                    >
                      ✓ Approve &amp; Close
                    </Button>

                    <Button
                      id="action-reject-reopen"
                      type="button"
                      variant="outline"
                      loading={actionLoading}
                      className="border-red-300 bg-white text-red-700 hover:bg-red-50 hover:border-red-400 font-bold shadow-xs cursor-pointer"
                      onClick={() => {
                        if (!reviewRemarks.trim()) {
                          toast.error('Please enter a rejection reason or rework instructions before rejecting.')
                          return
                        }
                        void run(async () => {
                          await ticketService.reopen(ticket._id, reviewRemarks.trim())
                          setReviewRemarks('')
                        }, 'Ticket rejected — automatically reopened for technician rework.')
                      }}
                    >
                      ✕ Reject &amp; Reopen for Rework
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pending Approval Notice for Employee */}
          {ticket.status === 'pending_approval' && role === 'employee' && (
            <div className="w-full rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm">
              <p className="font-semibold text-orange-800">⏳ Submitted for Approval</p>
              <p className="text-xs text-orange-600 mt-0.5">
                You have submitted your resolution work. The ticket is currently under review by your department manager.
              </p>
            </div>
          )}

          {ticket.status !== 'pending_approval' && canAssign && (
            <Button type="button" id="action-assign" onClick={() => setAssignOpen(true)}>
              Assign Ticket
            </Button>
          )}
          {ticket.status !== 'pending_approval' && canAccept && (
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
          {ticket.status !== 'pending_approval' && canStart && (
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
          {ticket.status !== 'pending_approval' && canResolve && (
            <Button
              id="action-resolve"
              type="button"
              variant="secondary"
              onClick={() => setResolveOpen(true)}
            >
              {role === 'employee' ? 'Complete & Request Approval' : 'Mark Resolved'}
            </Button>
          )}
          {ticket.status !== 'pending_approval' && canReopen && (
            <Button
              id="action-reopen"
              type="button"
              variant="ghost"
              loading={actionLoading}
              onClick={() => setReopenOpen(true)}
            >
              Reopen
            </Button>
          )}
          {ticket.status !== 'pending_approval' && canClose && (
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
                {ticket.comments.map((c, idx) => {
                  const isReq = c.isRequester || !c.author
                  const authorName = isReq ? (c.authorName || ticket.requester.name) : getName(c.author, 'Staff')
                  return (
                    <li
                      key={c._id || idx}
                      className={`rounded-xl p-3.5 text-sm border ${
                        isReq
                          ? 'bg-amber-50/50 border-amber-200'
                          : 'bg-[var(--surface)] border-[var(--border)]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold uppercase ${
                              isReq
                                ? 'bg-amber-200 text-amber-900'
                                : 'bg-[var(--primary-blue-light)] text-[var(--primary-blue)]'
                            }`}
                          >
                            {getInitials(authorName)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-xs text-[var(--ink)]">
                                {authorName}
                              </p>
                              <span
                                className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                                  isReq
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-blue-50 text-[var(--primary-blue)] border border-blue-200'
                                }`}
                              >
                                {isReq ? 'Requester' : 'Staff'}
                              </span>
                            </div>
                            <p className="text-[11px] text-[var(--ink-muted)]">
                              {format(new Date(c.createdAt), 'dd MMM, HH:mm')}
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="text-[var(--ink)] pl-9">{c.message}</p>
                    </li>
                  )
                })}
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

      <Modal
        open={reopenOpen}
        onClose={() => setReopenOpen(false)}
        title="Reopen Ticket"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void run(async () => {
              await ticketService.reopen(ticket._id, reopenReason.trim() || 'Reopened by manager')
              setReopenOpen(false)
              setReopenReason('')
            }, 'Ticket reopened')
          }}
          className="space-y-4"
        >
          <p className="text-xs text-[var(--ink-muted)]">
            Explain why this ticket is being reopened. The technician will be notified.
          </p>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)] mb-1">
              Reopen Reason / Instructions
            </label>
            <textarea
              rows={3}
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              placeholder="Enter reason for reopening..."
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--white)] p-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--primary-blue)]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setReopenOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={actionLoading}>
              Confirm Reopen
            </Button>
          </div>
        </form>
      </Modal>

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
