import { format } from 'date-fns'
import type { Activity } from '../../types'
import { formatLabel } from '../../lib/utils'

export function TicketTimeline({ activities }: { activities: Activity[] }) {
  if (!activities.length) {
    return <p className="text-sm text-slate-500">No activity recorded yet.</p>
  }

  const ordered = [...activities].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  return (
    <ol className="relative space-y-0 border-l border-slate-200 pl-6">
      {ordered.map((item) => (
        <li key={item._id} className="relative pb-6 last:pb-0">
          <span className="absolute -left-[1.55rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-accent" />
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-navy">{formatLabel(item.action)}</p>
            <time className="text-xs text-slate-500">
              {format(new Date(item.createdAt), 'dd MMM yyyy, HH:mm')}
            </time>
          </div>
          {item.message && <p className="mt-1 text-sm text-slate-600">{item.message}</p>}
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
            {item.fromStatus && item.toStatus && (
              <span>
                {formatLabel(item.fromStatus)} → {formatLabel(item.toStatus)}
              </span>
            )}
            {item.actor?.name && <span>by {item.actor.name}</span>}
          </div>
        </li>
      ))}
    </ol>
  )
}
