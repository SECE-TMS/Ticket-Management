import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
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
      toast.error(getErrorMessage(err, 'Ticket not found'))
    } finally {
      setLoading(false)
    }
  })

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="font-display text-3xl font-semibold text-navy">Track a ticket</h1>
      <p className="mt-2 text-sm text-slate-600">
        Enter the ticket code and the mobile number used when the request was submitted.
      </p>

      <form onSubmit={onSubmit} className="panel mt-6 grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
        <label className="block text-sm sm:col-span-1">
          <span className="mb-1 block font-medium text-slate-700">Ticket code</span>
          <input
            {...register('ticketCode')}
            className="h-10 w-full rounded-lg border border-slate-200 px-3 uppercase outline-none focus:border-accent"
            placeholder="TMS-XXXX"
          />
          {errors.ticketCode && (
            <span className="mt-1 block text-xs text-red-600">{errors.ticketCode.message}</span>
          )}
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Mobile</span>
          <input
            {...register('mobile')}
            className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-accent"
            inputMode="numeric"
            maxLength={10}
            placeholder="9876543210"
          />
          {errors.mobile && (
            <span className="mt-1 block text-xs text-red-600">{errors.mobile.message}</span>
          )}
        </label>
        <div className="sm:col-span-2">
          <Button type="submit" loading={loading} className="w-full sm:w-auto">
            Track status
          </Button>
        </div>
      </form>

      {ticket && (
        <div className="mt-8 space-y-4">
          <div className="panel p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-lg font-semibold text-navy">{ticket.ticketCode}</p>
                <p className="mt-1 text-sm text-slate-600">{ticket.complaintType}</p>
              </div>
              <div className="flex gap-2">
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
              </div>
            </div>
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Requester</dt>
                <dd className="font-medium text-navy">{ticket.requester.name}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Department</dt>
                <dd className="font-medium text-navy">{getName(ticket.department)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Created</dt>
                <dd className="font-medium text-navy">
                  {format(new Date(ticket.createdAt), 'dd MMM yyyy, HH:mm')}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Assignee</dt>
                <dd className="font-medium text-navy">{getName(ticket.assignedTo, 'Pending')}</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-slate-700">{ticket.description}</p>
            {ticket.userAttachment?.url && (
              <div className="mt-4">
                {ticket.userAttachment.type === 'image' ? (
                  <img
                    src={ticket.userAttachment.url}
                    alt="Ticket attachment"
                    className="max-h-56 rounded-lg border border-slate-100"
                  />
                ) : (
                  <audio controls src={ticket.userAttachment.url} className="w-full" />
                )}
              </div>
            )}
          </div>

          <div className="panel p-5 sm:p-6">
            <h2 className="font-display text-lg font-semibold text-navy">Status timeline</h2>
            <div className="mt-4">
              <TicketTimeline activities={activities} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
