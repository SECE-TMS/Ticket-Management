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
  const iconBgClass = {
    blue: 'bg-[var(--primary-blue-light)] text-[var(--primary-blue)]',
    gold: 'bg-[var(--gold-light)] text-[var(--gold-dark)]',
    success: 'bg-[var(--success-light)] text-[var(--success)]',
    danger: 'bg-[var(--danger-light)] text-[var(--danger)]',
  }[accent]

  const topBorderColor = {
    blue: 'var(--primary-blue)',
    gold: 'var(--gold)',
    success: 'var(--success)',
    danger: 'var(--danger)',
  }[accent]

  return (
    <div
      className={cn(
        'rounded-xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md',
        className
      )}
      style={{ borderTop: `3px solid ${topBorderColor}` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
            {label}
          </p>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight text-[var(--ink)]">
            {value}
          </p>
          {hint && (
            <p className="mt-1 text-xs text-[var(--ink-muted)]">
              {hint}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              iconBgClass
            )}
            aria-hidden
          >
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
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--ink)] sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
