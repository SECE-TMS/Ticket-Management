import { format } from 'date-fns'
import type { Activity } from '../../types'
import { formatLabel } from '../../lib/utils'

export function TicketTimeline({ activities }: { activities: Activity[] }) {
  if (!activities.length) {
    return (
      <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
        No activity recorded yet.
      </p>
    )
  }

  const ordered = [...activities].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  return (
    <ol className="timeline-line space-y-0" aria-label="Ticket activity timeline">
      {ordered.map((item, idx) => (
        <li key={item._id} className="relative pb-6 last:pb-0">
          <span className="timeline-dot" aria-hidden />
          <div
            className="rounded-lg p-3 transition"
            style={{
              background: idx === ordered.length - 1 ? 'var(--primary-blue-light)' : 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p
                className="text-sm font-semibold"
                style={{ color: 'var(--primary-blue)' }}
              >
                {formatLabel(item.action)}
              </p>
              <time
                className="text-xs font-medium"
                style={{ color: 'var(--ink-muted)' }}
                dateTime={item.createdAt}
              >
                {format(new Date(item.createdAt), 'dd MMM yyyy, HH:mm')}
              </time>
            </div>

            {item.message && (
              <p className="mt-1 text-sm" style={{ color: 'var(--ink)' }}>
                {item.message}
              </p>
            )}

            <div
              className="mt-1.5 flex flex-wrap gap-2 text-xs"
              style={{ color: 'var(--ink-muted)' }}
            >
              {item.fromStatus && item.toStatus && (
                <span className="flex items-center gap-1">
                  <span className="badge" style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem', background: 'var(--surface-2)', color: 'var(--ink-muted)' }}>
                    {formatLabel(item.fromStatus)}
                  </span>
                  <span>→</span>
                  <span className="badge" style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem', background: 'var(--primary-blue-light)', color: 'var(--primary-blue)' }}>
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
