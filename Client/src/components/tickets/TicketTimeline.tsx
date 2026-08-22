import { format } from 'date-fns'
import type { Activity } from '../../types'
import { formatLabel } from '../../lib/utils'

export function TicketTimeline({ activities }: { activities: Activity[] }) {
  if (!activities.length) {
    return (
      <p className="text-sm text-[var(--ink-muted)]">
        No activity recorded yet.
      </p>
    )
  }

  const ordered = [...activities].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  return (
    <ol className="relative border-l-2 border-[var(--primary-blue-light)] pl-6 space-y-0" aria-label="Ticket activity timeline">
      {ordered.map((item, idx) => (
        <li key={item._id} className="relative pb-6 last:pb-0">
          {/* Timeline Dot */}
          <span
            className="absolute -left-[1.95rem] top-1.5 h-3 w-3 rounded-full bg-[var(--primary-blue)] border-2 border-[var(--white)] ring-2 ring-[var(--primary-blue-light)]"
            aria-hidden
          />

          <div
            className={`rounded-xl p-3.5 border transition-all ${
              idx === ordered.length - 1
                ? 'bg-[var(--primary-blue-light)] border-[var(--primary-blue-muted)]'
                : 'bg-[var(--surface)] border-[var(--border)]'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-[var(--primary-blue)]">
                {formatLabel(item.action)}
              </p>
              <time
                className="text-xs font-semibold text-[var(--ink-muted)]"
                dateTime={item.createdAt}
              >
                {format(new Date(item.createdAt), 'dd MMM yyyy, HH:mm')}
              </time>
            </div>

            {item.message && (
              <p className="mt-1 text-sm text-[var(--ink)]">
                {item.message}
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--ink-muted)]">
              {item.fromStatus && item.toStatus && (
                <span className="inline-flex items-center gap-1">
                  <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-semibold text-[var(--ink-muted)]">
                    {formatLabel(item.fromStatus)}
                  </span>
                  <span>→</span>
                  <span className="rounded-full bg-[var(--primary-blue-light)] px-2 py-0.5 text-[10px] font-bold text-[var(--primary-blue)]">
                    {formatLabel(item.toStatus)}
                  </span>
                </span>
              )}
              {item.actor?.name && (
                <span className="italic">by {item.actor.name}</span>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}
