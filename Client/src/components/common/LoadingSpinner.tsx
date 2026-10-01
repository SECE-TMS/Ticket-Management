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
        {/* Animated Glow Halo */}
        <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-blue-500/10 via-amber-400/10 to-blue-600/10 blur-xl animate-pulse" />

        {/* Logo Card with Rotating Accent Ring */}
        <div className="relative flex items-center justify-center">
          {/* Subtle Outer Spinner Ring */}
          <div
            className="absolute -inset-3 rounded-2xl border-2 border-transparent border-t-[var(--primary-blue)] border-r-[var(--gold)] animate-spin"
            style={{ animationDuration: '2.5s' }}
          />

          {/* Logo Container */}
          <div className="relative flex h-24 w-28 sm:h-28 sm:w-36 items-center justify-center rounded-2xl bg-white/95 p-3 shadow-xl shadow-blue-900/10 border border-slate-100">
            <img
              src={sriEshwarLogo}
              alt="Sri Eshwar College of Engineering"
              className="h-full w-full object-contain filter drop-shadow-sm transition-transform duration-700 animate-pulse"
            />
          </div>
        </div>

        {/* Loading Progress Bar */}
        <div className="mt-6 w-36 sm:w-44 h-1.5 bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
          <div
            className="h-full rounded-full animate-[shimmer_1.5s_infinite_linear]"
            style={{
              background: 'linear-gradient(90deg, var(--primary-blue) 0%, var(--gold) 50%, var(--primary-blue) 100%)',
              backgroundSize: '200% 100%',
              animation: 'loadingSlide 1.6s ease-in-out infinite',
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
        @keyframes loadingSlide {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(20%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  )
}
