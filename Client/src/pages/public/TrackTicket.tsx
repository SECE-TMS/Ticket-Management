import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ArrowLeft, Search } from 'lucide-react'
import { ticketService } from '../../services/ticketService'
import { Button } from '../../components/common/Button'
import { StatusBadge, PriorityBadge } from '../../components/common/Badge'
import { TicketTimeline } from '../../components/tickets/TicketTimeline'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../lib/utils'
import type { Activity, Ticket } from '../../types'
import { getName } from '../../types'

const schema = z.object({
  ticketCode: z.string().min(5, 'Enter your ticket code'),
  mobile: z.string().regex(/^\d{10}$/, 'Enter the 10-digit mobile used when raising'),
})

type FormValues = z.infer<typeof schema>

export function TrackTicket() {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])

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

  const inputClass = (hasError?: boolean) =>
    `h-10 w-full rounded-lg border bg-[var(--white)] px-3 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20 ${
      hasError ? 'border-[var(--danger)]' : 'border-[var(--border)]'
    }`

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--primary-blue)] hover:underline"
      >
        <ArrowLeft size={15} />
        Home
      </Link>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--ink)]">Track a Ticket</h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Enter the ticket code and the mobile number used when raising the request.
        </p>
      </div>

      {/* Search form */}
      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-[var(--border)] bg-[var(--white)] p-6 shadow-xs"
        id="track-ticket-form"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="track-code" className="text-sm font-semibold text-[var(--ink)]">
              Ticket code
            </label>
            <input
              id="track-code"
              {...register('ticketCode')}
              className={`uppercase ${inputClass(!!errors.ticketCode)}`}
              placeholder="TMS-XXXX"
              autoComplete="off"
            />
            {errors.ticketCode && (
              <span className="text-xs text-[var(--danger)]">{errors.ticketCode.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="track-mobile" className="text-sm font-semibold text-[var(--ink)]">
              Mobile number
            </label>
            <input
              id="track-mobile"
              {...register('mobile')}
              className={inputClass(!!errors.mobile)}
              inputMode="numeric"
              maxLength={10}
              placeholder="9876543210"
            />
            {errors.mobile && (
              <span className="text-xs text-[var(--danger)]">{errors.mobile.message}</span>
            )}
          </div>

          <div className="sm:col-span-2">
            <Button
              id="track-submit"
              type="submit"
              loading={loading}
              className="w-full sm:w-auto"
            >
              <Search size={15} />
              Track status
            </Button>
          </div>
        </div>
      </form>

      {/* Results */}
      {ticket && (
        <div className="mt-8 space-y-4">
          {/* Ticket summary card */}
          <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--white)] shadow-xs">
            {/* Status color header */}
            <div className="bg-[var(--primary-blue)] px-6 py-4 text-[var(--white)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xl font-bold tracking-wider">
                    {ticket.ticketCode}
                  </p>
                  <p className="mt-1 text-sm text-white/75">
                    {ticket.complaintType}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="p-6">
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                {[
                  { label: 'Requester', value: ticket.requester.name },
                  { label: 'Department', value: getName(ticket.department) },
                  { label: 'Raised on', value: format(new Date(ticket.createdAt), 'dd MMM yyyy, HH:mm') },
                  { label: 'Assignee', value: getName(ticket.assignedTo, 'Pending assignment') },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                      {label}
                    </dt>
                    <dd className="mt-1 font-semibold text-[var(--ink)]">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>

              {ticket.description && (
                <div className="mt-5 rounded-xl bg-[var(--surface)] p-4 text-sm text-[var(--ink)] border border-[var(--border)]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)] mb-1">
                    Description
                  </p>
                  {ticket.description}
                </div>
              )}

              {ticket.userAttachment?.url && (
                <div className="mt-4">
                  {ticket.userAttachment.type === 'image' ? (
                    <img
                      src={ticket.userAttachment.url}
                      alt="Ticket attachment"
                      className="max-h-56 rounded-lg border border-[var(--border)]"
                    />
                  ) : (
                    <audio controls src={ticket.userAttachment.url} className="w-full" />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--white)] p-6 shadow-xs">
            <h2 className="text-base font-bold text-[var(--ink)] mb-4">Status timeline</h2>
            <TicketTimeline activities={activities} />
          </div>
        </div>
      )}
    </div>
  )
}
