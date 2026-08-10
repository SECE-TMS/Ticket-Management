import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

interface KpiCardProps {
  label: string
  value: number | string
  icon?: LucideIcon
  hint?: string
  className?: string
  accent?: 'blue' | 'gold' | 'success' | 'danger'
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
  className,
  accent = 'blue',
}: KpiCardProps) {
  const iconClass = {
    blue: 'kpi-icon-wrap',
    gold: 'kpi-icon-wrap gold',
    success: 'kpi-icon-wrap success',
    danger: 'kpi-icon-wrap danger',
  }[accent]

  const topBorderColor = {
    blue: 'var(--primary-blue)',
    gold: 'var(--gold)',
    success: 'var(--success)',
    danger: 'var(--danger)',
  }[accent]

  return (
    <div
      className={cn('kpi-card panel-hover', className)}
      style={{ borderTop: `3px solid ${topBorderColor}` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-semibold tracking-wide uppercase"
            style={{ color: 'var(--ink-muted)' }}
          >
            {label}
          </p>
          <p
            className="mt-2 font-display text-3xl font-bold tracking-tight"
            style={{ color: 'var(--ink)' }}
          >
            {value}
          </p>
          {hint && (
            <p className="mt-1 text-xs" style={{ color: 'var(--ink-muted)' }}>
              {hint}
            </p>
          )}
        </div>
        {Icon && (
          <div className={iconClass} aria-hidden>
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
    <div className="page-header flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="page-title">{title}</h1>
        {description && (
          <p className="page-subtitle">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
