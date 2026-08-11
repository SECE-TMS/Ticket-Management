import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'
import { LoadingSpinner } from './LoadingSpinner'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary:
    'bg-[var(--primary-blue)] text-[var(--white)] border-[var(--primary-blue)] hover:bg-[var(--primary-blue-dark)] hover:border-[var(--primary-blue-dark)] shadow-xs',
  secondary:
    'bg-[var(--gold)] text-[var(--primary-blue-deeper)] border-[var(--gold)] hover:bg-[var(--gold-dark)] hover:border-[var(--gold-dark)] shadow-xs font-bold',
  outline:
    'bg-transparent text-[var(--primary-blue)] border-[var(--primary-blue)] hover:bg-[var(--primary-blue-light)]',
  ghost:
    'bg-transparent text-[var(--ink-muted)] border-transparent hover:bg-[var(--surface-2)] hover:text-[var(--ink)]',
  danger:
    'bg-[var(--danger)] text-[var(--white)] border-[var(--danger)] hover:opacity-90',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs rounded-md',
  md: 'h-10 px-4 text-sm rounded-lg',
  lg: 'h-12 px-6 text-base rounded-xl font-bold',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading,
      disabled,
      children,
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 outline-none border cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <LoadingSpinner
          size="sm"
          className="border-white/30 border-t-white"
        />
      )}
      {children}
    </button>
  )
)

Button.displayName = 'Button'
