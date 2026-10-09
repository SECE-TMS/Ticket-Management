import { cn } from '../../lib/utils'
import sriEshwarLogo from '../../assets/sri_eshwar_clean.png'

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

interface PageLoaderProps {
  message?: string
  subtext?: string
  fullScreen?: boolean
  className?: string
}

export function PageLoader({
  message = 'Loading...',
  subtext = 'Sri Eshwar College of Engineering',
  fullScreen = false,
  className,
}: PageLoaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-6 text-center select-none',
        fullScreen
          ? 'fixed inset-0 z-50 bg-slate-50/90 backdrop-blur-md min-h-screen'
          : 'min-h-[50vh] w-full flex-1',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="relative flex flex-col items-center">
        {/* Soft Ambient Glow */}
        <div className="absolute -inset-6 rounded-full bg-blue-500/5 blur-2xl pointer-events-none" />

        {/* Logo Container Card */}
        <div className="relative flex h-24 w-32 sm:h-28 sm:w-40 items-center justify-center rounded-2xl bg-white p-3.5 shadow-lg shadow-slate-900/5 ring-1 ring-slate-200/70 transition-all duration-300">
          <img
            src={sriEshwarLogo}
            alt="Sri Eshwar College of Engineering"
            className="h-full w-full object-contain filter drop-shadow-sm transition-transform duration-500 hover:scale-105"
          />
        </div>

        {/* Modern Indeterminate Progress Bar */}
        <div className="mt-6 w-36 sm:w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
          <div
            className="absolute top-0 bottom-0 rounded-full"
            style={{
              width: '45%',
              background: 'linear-gradient(90deg, var(--primary-blue), #3b82f6, var(--gold))',
              animation: 'cleanSlide 1.4s ease-in-out infinite',
            }}
          />
        </div>

        {/* Text Details */}
        <div className="mt-3.5 space-y-1">
          <p className="text-sm font-semibold tracking-wide text-slate-800">
            {message}
          </p>
          {subtext && (
            <p className="text-xs font-medium text-slate-400">
              {subtext}
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes cleanSlide {
          0% {
            left: -45%;
          }
          50% {
            left: 55%;
          }
          100% {
            left: 100%;
          }
        }
      `}</style>
    </div>
  )
}

