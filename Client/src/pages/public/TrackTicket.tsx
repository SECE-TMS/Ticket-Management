import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Headset,
  MessageSquare,
  Phone,
  Printer,
  Search,
  Send,
  Share2,
  Star,
  ThumbsUp,
  Ticket as TicketIcon,
  Volume2,
  X,
} from 'lucide-react'
import { ticketService } from '../../services/ticketService'
import { Button } from '../../components/common/Button'
import { PriorityBadge, StatusBadge } from '../../components/common/Badge'
import { TicketTimeline } from '../../components/tickets/TicketTimeline'
import { ShareTicketModal } from '../../components/tickets/ShareTicketModal'
import { TicketReceiptModal } from '../../components/tickets/TicketReceiptModal'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage, getAttachmentUrl } from '../../lib/utils'
import type { Activity, Ticket } from '../../types'
import { getName } from '../../types'

const schema = z.object({
  ticketCode: z.string().min(5, 'Enter your ticket code'),
  mobile: z.string().regex(/^\d{10}$/, 'Enter the 10-digit mobile used when raising'),
})

type FormValues = z.infer<typeof schema>

function getProgressStep(status: string) {
  switch (status) {
    case 'new':
      return 1
    case 'assigned':
    case 'accepted':
      return 2
    case 'in_progress':
    case 'reopened':
      return 3
    case 'resolved':
    case 'closed':
      return 4
    default:
      return 1
  }
}

export function TrackTicket() {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [activeImageModal, setActiveImageModal] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { ticketCode: '', mobile: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true)
    try {
      const data = await ticketService.track(values.ticketCode.trim().toUpperCase(), values.mobile)
      setTicket(data.ticket)
      setActivities(data.activities)
    } catch (err) {
      setTicket(null)
      setActivities([])
      toast.error(getErrorMessage(err, 'Ticket not found — check your code and mobile number'))
    } finally {
      setLoading(false)
    }
  })

  const activeStep = ticket ? getProgressStep(ticket.status) : 1

  return (
    <div className="font-poppins mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Back button */}
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--primary-blue)] hover:underline"
      >
        <ArrowLeft size={16} />
        Back to Home
      </Link>

      {/* Top Banner Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[var(--primary-blue-deeper)] via-[var(--primary-blue)] to-[var(--primary-blue-dark)] p-6 text-[var(--white)] shadow-lg sm:p-8">
        <div
          className="pointer-events-none absolute -top-10 -right-10 h-60 w-60 rounded-full bg-[var(--gold)] opacity-15 blur-3xl"
          aria-hidden
        />

        <div className="relative z-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-[var(--gold)]/15 px-3.5 py-1 text-xs font-bold text-[var(--gold)]">
              <Headset size={13} />
              Live Campus Ticket Desk
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-[var(--white)] sm:text-3xl">
              Track Ticket Status
            </h1>
            <p className="mt-1 text-xs text-white/80 sm:text-sm">
              Enter your Ticket Reference Code &amp; Mobile Number to track progress.
            </p>
          </div>
        </div>
      </div>

      {/* Search Input Box */}
      <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--white)] p-6 shadow-sm sm:p-8">
        <form onSubmit={onSubmit} id="track-ticket-form" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="track-code" className="text-xs font-bold text-[var(--ink)]">
                Ticket Reference Code <span className="text-[var(--danger)]">*</span>
              </label>
              <div className="relative">
                <TicketIcon
                  size={16}
                  className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--ink-muted)]"
                />
                <input
                  id="track-code"
                  {...register('ticketCode')}
                  className={`h-11 w-full rounded-xl border bg-[var(--white)] pl-10 pr-3.5 font-mono text-sm font-bold uppercase tracking-wider text-[var(--ink)] outline-none transition-all focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20 ${errors.ticketCode ? 'border-[var(--danger)]' : 'border-[var(--border)]'
                    }`}
                  placeholder="  TMS-2026-000001"
                  autoComplete="off"
                />
              </div>
              {errors.ticketCode && (
                <span className="text-xs text-[var(--danger)]">{errors.ticketCode.message}</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="track-mobile" className="text-xs font-bold text-[var(--ink)]">
                Registered Mobile <span className="text-[var(--danger)]">*</span>
              </label>
              <div className="relative">
                <Phone
                  size={15}
                  className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--ink-muted)]"
                />
                <input
                  id="track-mobile"
                  {...register('mobile')}
                  inputMode="numeric"
                  maxLength={10}
                  className={`h-11 w-full rounded-xl border bg-[var(--white)] pl-10 pr-3.5 text-sm text-[var(--ink)] outline-none transition-all focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20 ${errors.mobile ? 'border-[var(--danger)]' : 'border-[var(--border)]'
                    }`}
                  placeholder="10-digit mobile number"
                />
              </div>
              {errors.mobile && (
                <span className="text-xs text-[var(--danger)]">{errors.mobile.message}</span>
              )}
            </div>
          </div>

          <div className="pt-2">
            <Button
              id="track-submit"
              type="submit"
              variant="secondary"
              size="lg"
              loading={loading}
              className="w-full text-base font-bold shadow-md hover:scale-[1.01]"
            >
              <Search size={16} /> Search Ticket Details
            </Button>
          </div>
        </form>
      </div>

      {/* Ticket Details View */}
      {ticket && (
        <div className="mt-8 space-y-6 animate-fade-in">
          {/* Main Status & Progress Header */}
          <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--white)] shadow-md">
            <div className="bg-gradient-to-r from-[var(--primary-blue-deeper)] via-[var(--primary-blue)] to-[var(--primary-blue-dark)] p-6 text-[var(--white)] sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--gold)]">
                    Active Ticket Record
                  </p>
                  <h2 className="mt-1 font-mono text-3xl font-bold tracking-wider text-[var(--white)]">
                    {ticket.ticketCode}
                  </h2>
                  <p className="mt-1 text-sm text-white/80 font-medium">
                    {ticket.complaintType} • {getName(ticket.department)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowShareModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition-colors cursor-pointer"
                    title="Share Ticket"
                  >
                    <Share2 size={14} /> Share
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowReceiptModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition-colors cursor-pointer"
                    title="Download/Print Receipt"
                  >
                    <Printer size={14} /> Download Receipt
                  </button>

                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                </div>
              </div>

              {/* 4-Step Visual Progress Bar */}
              <div className="mt-8 border-t border-white/10 pt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-white/70 mb-4">
                  Resolution Progress Pipeline
                </p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { step: 1, title: 'Submitted' },
                    { step: 2, title: 'Assigned' },
                    { step: 3, title: 'In Progress' },
                    { step: 4, title: 'Resolved' },
                  ].map((item) => {
                    const isDone = activeStep >= item.step
                    const isCurrent = activeStep === item.step
                    return (
                      <div key={item.step} className="flex flex-col items-center gap-2">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all ${isDone
                              ? 'bg-[var(--gold)] text-[var(--primary-blue-deeper)] shadow-md'
                              : 'bg-white/10 text-white/40'
                            } ${isCurrent ? 'ring-4 ring-yellow-400/30' : ''}`}
                        >
                          {isDone ? '✓' : item.step}
                        </div>
                        <span
                          className={`text-xs font-semibold ${isDone ? 'text-[var(--white)]' : 'text-white/40'
                            }`}
                        >
                          {item.title}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Key Information Cards */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)] mb-1">
                    Requester
                  </p>
                  <p className="text-sm font-bold text-[var(--ink)]">{ticket.requester.name}</p>
                  <p className="text-xs text-[var(--ink-muted)]">{ticket.requester.mobile}</p>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)] mb-1">
                    Technician / Specialist
                  </p>
                  <p className="text-sm font-bold text-[var(--primary-blue)]">
                    {getName(ticket.assignedTo, 'Pending assignment')}
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)] mb-1 flex items-center gap-1">
                    <Calendar size={13} /> Raised On
                  </p>
                  <p className="text-xs font-bold text-[var(--ink)]">
                    {format(new Date(ticket.createdAt), 'dd MMM yyyy, HH:mm')}
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)] mb-1 flex items-center gap-1">
                    <Clock size={13} /> Target Resolution
                  </p>
                  <p className="text-xs font-bold text-[var(--ink)]">
                    {ticket.expectedResolutionAt
                      ? format(new Date(ticket.expectedResolutionAt), 'dd MMM yyyy, HH:mm')
                      : 'Standard SLA'}
                  </p>
                </div>
              </div>

              {/* Description */}
              {ticket.description && (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)] mb-2 flex items-center gap-1.5">
                    <FileText size={15} className="text-[var(--primary-blue)]" /> Issue Description
                  </p>
                  <p className="text-sm leading-relaxed text-[var(--ink)]">
                    {ticket.description}
                  </p>
                </div>
              )}

              {/* ── BEFORE & AFTER MEDIA PROOF GALLERY (2-COL GRID) ────────────────── */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ink)] mb-3 flex items-center gap-2">
                  <Camera size={16} className="text-[var(--primary-blue)]" />
                  Media Proof &amp; Attachments
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Card 1: Initial Reported Issue Attachment (Before) */}
                  <div className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                    <div>
                      <div className="flex items-center justify-between mb-3">
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
                            <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--white)] p-4 text-center">
                              <Camera size={24} className="mb-2 text-[var(--ink-muted)] opacity-50" />
                              <p className="text-xs font-semibold text-[var(--ink-muted)]">
                                No media attached during ticket submission.
                              </p>
                            </div>
                          )
                        }

                        return (
                          <div className="space-y-3">
                            {allAtts.map((att, idx) => (
                              <div key={idx} className="rounded-xl border border-[var(--border)] bg-[var(--white)] p-2">
                                {att.type === 'image' && (
                                  <div
                                    className="group relative cursor-pointer overflow-hidden rounded-xl border border-[var(--border)] bg-black/5"
                                    onClick={() => setActiveImageModal(att.url)}
                                  >
                                    <img
                                      src={getAttachmentUrl(att.url)}
                                      alt={`Attachment ${idx + 1}`}
                                      className="h-48 w-full object-cover transition-all duration-200 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-all group-hover:opacity-100">
                                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-bold text-[var(--ink)] shadow-md">
                                        <ExternalLink size={13} /> View Full Photo
                                      </span>
                                    </div>
                                  </div>
                                )}
                                {att.type === 'video' && (
                                  <div className="overflow-hidden rounded-xl bg-black">
                                    <video controls src={getAttachmentUrl(att.url)} className="w-full max-h-56 rounded-xl object-contain" />
                                  </div>
                                )}
                                {att.type === 'audio' && (
                                  <div className="p-1">
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
                  <div className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                    <div>
                      {(() => {
                        const isCompleted = ticket.status === 'resolved' || ticket.status === 'closed' || !!ticket.resolution?.attachment?.url
                        return (
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-xs font-bold uppercase tracking-wider ${isCompleted ? 'text-[var(--success)]' : 'text-[var(--ink-muted)]'}`}>
                              {isCompleted ? '✅ Completion Proof' : '⏳ Completion Proof'}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isCompleted
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
                            className="group relative cursor-pointer overflow-hidden rounded-xl border border-green-200 bg-black/5"
                            onClick={() => setActiveImageModal(ticket.resolution!.attachment!.url!)}
                          >
                            <img
                              src={getAttachmentUrl(ticket.resolution.attachment.url)}
                              alt="Completion Resolution Proof"
                              className="h-48 w-full object-cover transition-all duration-200 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-all group-hover:opacity-100">
                              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-bold text-[var(--ink)] shadow-md">
                                <ExternalLink size={13} /> View Resolution Photo
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-green-200 bg-[var(--white)] p-4">
                            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-[var(--success)]">
                              <Volume2 size={15} /> Technician Audio Proof
                            </div>
                            <audio controls src={getAttachmentUrl(ticket.resolution.attachment.url)} className="w-full h-10" />
                          </div>
                        )
                      ) : (
                        <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--white)] p-4 text-center">
                          <Clock size={24} className="mb-2 text-[var(--ink-muted)] opacity-50" />
                          <p className="text-xs font-semibold text-[var(--ink-muted)]">
                            {ticket.status === 'resolved' || ticket.status === 'closed'
                              ? 'Resolved without attachment'
                              : 'Pending work completion by technician'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Technician Resolution Remarks Callout */}
              {ticket.resolution?.remarks && (
                <div className="rounded-2xl border border-[var(--success)]/30 bg-[var(--success-light)] p-5 shadow-xs">
                  <div className="flex items-center gap-2 mb-1.5">
                    <CheckCircle2 size={18} className="text-[var(--success)]" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--success)]">
                      Technician Resolution Notes
                    </h4>
                  </div>
                  <p className="text-sm leading-relaxed text-[var(--ink)]">
                    {ticket.resolution.remarks}
                  </p>
                </div>
              )}

              {/* ── FEEDBACK & RATING SECTION FOR COMPLETED TICKETS ──────────────── */}
              {(ticket.status === 'resolved' || ticket.status === 'closed') && (
                <FeedbackCard ticket={ticket} onFeedbackSubmitted={(updatedTicket) => setTicket(updatedTicket)} />
              )}
            </div>
          </div>

          {/* Activity Timeline Card */}
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--white)] p-6 shadow-sm sm:p-8">
            <h3 className="text-base font-bold text-[var(--ink)] mb-4">
              Activity &amp; Status History
            </h3>
            <TicketTimeline activities={activities} />
          </div>
        </div>
      )}

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

      {/* Share Ticket Modal */}
      {ticket && (
        <ShareTicketModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          ticketCode={ticket.ticketCode}
          mobile={ticket.requester.mobile}
          departmentName={getName(ticket.department)}
          complaintType={ticket.complaintType}
        />
      )}

      {/* Ticket Receipt Printable Modal */}
      {ticket && (
        <TicketReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          ticket={ticket}
        />
      )}
    </div>
  )
}

const RATING_LABELS: Record<number, string> = {
  1: 'Poor — Needs Improvement',
  2: 'Fair — Acceptable Service',
  3: 'Good — Satisfactory Work',
  4: 'Very Good — Great Job',
  5: 'Excellent — Outstanding Support!',
}

function FeedbackCard({
  ticket,
  onFeedbackSubmitted,
}: {
  ticket: Ticket
  onFeedbackSubmitted: (updated: Ticket) => void
}) {
  const toast = useToast()
  const [rating, setRating] = useState<number>(ticket.feedback?.rating || 5)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [comment, setComment] = useState<string>(ticket.feedback?.comment || '')
  const [loading, setLoading] = useState(false)

  const hasFeedback = Boolean(ticket.feedback && ticket.feedback.rating && ticket.feedback.rating >= 1)

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rating) {
      toast.error('Please select a star rating')
      return
    }
    setLoading(true)
    try {
      const updated = await ticketService.submitFeedback({
        ticketCode: ticket.ticketCode,
        mobile: ticket.requester.mobile,
        rating,
        comment,
      })
      toast.success('Thank you for your feedback!')
      onFeedbackSubmitted(updated)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to submit feedback'))
    } finally {
      setLoading(false)
    }
  }

  if (hasFeedback && ticket.feedback) {
    const existingFeedback = ticket.feedback
    return (
      <div className="rounded-2xl border border-[var(--gold)]/40 bg-[var(--gold-light)]/40 p-6 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <ThumbsUp size={18} className="text-[var(--gold-dark)]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--gold-dark)]">
              Your Submitted Feedback
            </h4>
          </div>
          <span className="text-xs text-[var(--ink-muted)] font-medium">
            {format(new Date(existingFeedback.submittedAt), 'dd MMM yyyy')}
          </span>
        </div>

        {/* Stars */}
        <div className="flex items-center gap-1.5 mb-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={22}
              className={`${star <= (existingFeedback.rating || 0)
                  ? 'fill-[var(--gold)] text-[var(--gold)]'
                  : 'text-slate-300'
                }`}
            />
          ))}
          <span className="ml-2 text-sm font-bold text-[var(--ink)]">
            {existingFeedback.rating}/5 — {RATING_LABELS[existingFeedback.rating]}
          </span>
        </div>

        {/* Remarks */}
        {existingFeedback.comment && (
          <p className="text-sm italic text-[var(--ink)] bg-white/70 p-3 rounded-xl border border-[var(--border)]">
            "{existingFeedback.comment}"
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[var(--primary-blue)]/30 bg-[var(--primary-blue-light)]/30 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare size={18} className="text-[var(--primary-blue)]" />
        <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--primary-blue)]">
          Rate Your Resolution Experience
        </h4>
      </div>
      <p className="text-xs text-[var(--ink-muted)] mb-5">
        How satisfied are you with the resolution of ticket <strong>{ticket.ticketCode}</strong>?
      </p>

      <form onSubmit={handleSubmitFeedback} className="space-y-5">
        {/* Interactive 5 Star Selector */}
        <div className="flex flex-col items-start gap-2">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = star <= (hoverRating || rating)
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-125 cursor-pointer focus:outline-none"
                  aria-label={`Rate ${star} stars`}
                >
                  <Star
                    size={32}
                    className={`transition-colors ${active
                        ? 'fill-[var(--gold)] text-[var(--gold)] drop-shadow-xs'
                        : 'text-slate-300 hover:text-yellow-300'
                      }`}
                  />
                </button>
              )
            })}
          </div>
          <span className="text-xs font-bold text-[var(--primary-blue)]">
            {RATING_LABELS[hoverRating || rating] || 'Select Rating'}
          </span>
        </div>

        {/* Remarks Input */}
        <div>
          <label htmlFor="feedback-comment" className="text-xs font-bold text-[var(--ink-muted)] uppercase tracking-wider block mb-1">
            Additional Comments / Suggestions:
          </label>
          <textarea
            id="feedback-comment"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us what went well or how we can improve..."
            className="w-full rounded-xl border border-[var(--border)] bg-white p-3 text-xs text-[var(--ink)] outline-none focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={loading}
          className="w-full font-bold shadow-md hover:scale-[1.01]"
        >
          <Send size={15} /> Submit Feedback
        </Button>
      </form>
    </div>
  )
}
