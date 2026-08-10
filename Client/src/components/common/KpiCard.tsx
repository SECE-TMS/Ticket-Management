import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

interface KpiCardProps {
  label: string
  value: number | string
  icon?: LucideIcon
  hint?: string
  className?: string
}

export function KpiCard({ label, value, icon: Icon, hint, className }: KpiCardProps) {
  return (
    <div className={cn('panel p-4 sm:p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</p>
          <p className="mt-2 font-display text-3xl font-semibold text-navy">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
        {Icon && (
          <div className="rounded-lg bg-teal-50 p-2.5 text-accent">
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  )
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-semibold text-navy sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
      </div>
      {actions}
    </div>
  )
}
