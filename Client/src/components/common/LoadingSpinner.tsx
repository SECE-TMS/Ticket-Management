import { cn } from '../../lib/utils'
import sriEshwarCleanLogo from '../../assets/sri_eshwar_clean.png'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  sm: 'h-4 w-4 border-2',
  md: 'h-7 w-7 border-[2.5px]',
  lg: 'h-10 w-10 border-3',
  xl: 'h-14 w-14 border-4',
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-t-transparent',
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

interface PageLoaderProps {
  message?: string
  subtitle?: string
  fullScreen?: boolean
  className?: string
  compact?: boolean
}

export function PageLoader({
  message = 'Loading...',
  subtitle = 'Sri Eshwar College of Engineering',
  fullScreen = false,
  className,
  compact = false,
}: PageLoaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center animate-fade-in transition-all',
        fullScreen
          ? 'fixed inset-0 z-50 bg-[var(--surface)]/90 backdrop-blur-sm min-h-screen p-4'
          : 'min-h-[340px] w-full p-6',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="relative flex flex-col items-center max-w-sm w-full mx-auto">
        {/* Soft Ambient Brand Glow Behind Card */}
        <div
          className="pointer-events-none absolute -inset-6 rounded-3xl bg-gradient-to-tr from-[var(--primary-blue)]/15 via-[var(--gold)]/10 to-[var(--primary-blue)]/10 blur-2xl animate-pulse-glow"
          aria-hidden="true"
        />

        {/* Clean Logo Presentation Card */}
        <div className="relative flex flex-col items-center w-full max-w-[300px] bg-white rounded-2xl p-6 sm:p-7 shadow-xl shadow-slate-900/5 border border-slate-200/90">
          {/* Subtle Top Accent Gradient Line */}
          <div className="absolute top-0 left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-[var(--primary-blue)] to-transparent rounded-full opacity-75" />

          {/* Sri Eshwar College Clean Logo */}
          <div className="relative flex items-center justify-center mb-5 px-2">
            <img
              src={sriEshwarCleanLogo}
              alt="Sri Eshwar College of Engineering"
              className={cn(
                'w-auto object-contain select-none transition-all duration-300 drop-shadow-xs',
                compact ? 'h-10 sm:h-11 max-w-[190px]' : 'h-13 sm:h-15 max-w-[230px]'
              )}
            />
          </div>

          {/* Smooth Dual-Color Indeterminate Progress Bar */}
          <div className="relative w-full max-w-[180px] h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4">
            <div className="absolute inset-y-0 w-1/2 rounded-full bg-gradient-to-r from-[var(--primary-blue)] via-[var(--primary-blue-dark)] to-[var(--gold)] animate-indeterminate" />
          </div>

          {/* Status Text & Subtitle */}
          <div className="flex flex-col items-center text-center space-y-1">
            <p className="text-sm font-semibold text-[var(--ink)] tracking-tight">
              {message}
            </p>
            {subtitle && (
              <p className="text-xs font-medium text-[var(--ink-muted)]">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Portal Badge */}
        <p className="mt-3.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Ticket Management System
        </p>
      </div>
    </div>
  )
}

