import { cn } from '../../lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-[3px]',
  lg: 'h-12 w-12 border-4',
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full',
        sizes[size],
        className
      )}
      style={{
        borderColor: 'var(--primary-blue-muted)',
        borderTopColor: 'var(--primary-blue)',
      }}
      role="status"
      aria-label="Loading"
    />
  )
}

export function PageLoader() {
  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center gap-4"
      role="status"
      aria-live="polite"
    >
      {/* Animated logo mark */}
      <div
        className="animate-pulse-ring flex h-14 w-14 items-center justify-center rounded-xl font-bold text-lg"
        style={{
          background: 'var(--primary-blue)',
          color: 'var(--white)',
        }}
      >
        TM
      </div>
      <div className="flex flex-col items-center gap-1">
        <LoadingSpinner size="md" />
        <p className="text-sm font-medium" style={{ color: 'var(--ink-muted)' }}>
          Loading…
        </p>
      </div>
    </div>
  )
}
