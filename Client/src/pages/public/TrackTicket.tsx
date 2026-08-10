import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { Search } from 'lucide-react'
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8">
        <h1 className="page-title">Track a Ticket</h1>
        <p className="page-subtitle">
          Enter the ticket code and the mobile number used when raising the request.
        </p>
      </div>

      {/* Search form */}
      <form
        onSubmit={onSubmit}
        className="panel p-6"
        id="track-ticket-form"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="form-field">
            <label htmlFor="track-code" className="form-label">
              Ticket code
            </label>
            <input
              id="track-code"
              {...register('ticketCode')}
              className={`input-field uppercase ${errors.ticketCode ? 'input-error' : ''}`}
              placeholder="TMS-XXXX"
              autoComplete="off"
            />
            {errors.ticketCode && (
              <span className="form-error">{errors.ticketCode.message}</span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="track-mobile" className="form-label">
              Mobile number
            </label>
            <input
              id="track-mobile"
              {...register('mobile')}
              className={`input-field ${errors.mobile ? 'input-error' : ''}`}
              inputMode="numeric"
              maxLength={10}
              placeholder="9876543210"
            />
            {errors.mobile && (
              <span className="form-error">{errors.mobile.message}</span>
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
        <div className="mt-8 space-y-4 animate-fade-in">
          {/* Ticket summary card */}
          <div className="panel overflow-hidden">
            {/* Status color header */}
            <div
              className="px-6 py-4"
              style={{ background: 'var(--primary-blue)', color: 'var(--white)' }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xl font-bold tracking-wider">
                    {ticket.ticketCode}
                  </p>
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
                    <dt className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--ink-muted)' }}>
                      {label}
                    </dt>
                    <dd className="mt-1 font-medium" style={{ color: 'var(--ink)' }}>
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>

              {ticket.description && (
                <div
                  className="mt-5 rounded-lg p-4 text-sm"
                  style={{ background: 'var(--surface)', color: 'var(--ink)' }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--ink-muted)' }}>
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
                      className="max-h-56 rounded-lg"
                      style={{ border: '1px solid var(--border)' }}
                    />
                  ) : (
                    <audio controls src={ticket.userAttachment.url} className="w-full" />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="panel p-6">
            <h2 className="section-title mb-4">Status timeline</h2>
            <TicketTimeline activities={activities} />
          </div>
        </div>
      )}
    </div>
  )
}
