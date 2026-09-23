import React, { forwardRef, useState } from 'react'
import { Eye, EyeOff, Check, X, ShieldCheck } from 'lucide-react'
import { validatePassword } from '../../utils/passwordValidator'

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  helperText?: string
  showStrengthMeter?: boolean
  showValidationRules?: boolean
  containerClassName?: string
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      label,
      error,
      helperText,
      showStrengthMeter = false,
      showValidationRules = false,
      containerClassName = '',
      className = '',
      value,
      onChange,
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false)
    const [internalValue, setInternalValue] = useState('')

    // Track current string value whether controlled or uncontrolled
    const currentVal = (value !== undefined ? String(value) : internalValue) || ''
    const validation = validatePassword(currentVal)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (value === undefined) {
        setInternalValue(e.target.value)
      }
      onChange?.(e)
    }

    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-[var(--ink)]">
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          <input
            id={inputId}
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            value={value}
            onChange={handleChange}
            className={`h-10 w-full rounded-lg border bg-[var(--white)] pl-3 pr-10 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20 ${
              error
                ? 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]/20'
                : 'border-[var(--border)]'
            } ${className}`}
            {...props}
          />

          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-2.5 flex h-7 w-7 items-center justify-center rounded-md text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ink)] focus:outline-none"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Password Strength Meter */}
        {showStrengthMeter && currentVal.length > 0 && (
          <div className="mt-1 space-y-1.5 rounded-lg border border-[var(--border)]/70 bg-[var(--surface)] p-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 font-medium text-[var(--ink-muted)]">
                <ShieldCheck size={13} className="text-[var(--primary-blue)]" /> Strength:
              </span>
              <span
                className={`font-semibold ${
                  validation.score <= 1
                    ? 'text-red-600'
                    : validation.score === 2
                    ? 'text-orange-600'
                    : validation.score === 3
                    ? 'text-amber-600'
                    : validation.score === 4
                    ? 'text-blue-600'
                    : 'text-emerald-600'
                }`}
              >
                {validation.strengthLabel}
              </span>
            </div>

            {/* Segmented Strength Bar */}
            <div className="grid grid-cols-5 gap-1.5 h-1.5">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`h-full rounded-full transition-all duration-300 ${
                    validation.score >= level
                      ? validation.score <= 1
                        ? 'bg-red-500'
                        : validation.score === 2
                        ? 'bg-orange-500'
                        : validation.score === 3
                        ? 'bg-amber-500'
                        : validation.score === 4
                        ? 'bg-blue-600'
                        : 'bg-emerald-500'
                      : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Live Validation Rules Checklist */}
        {showValidationRules && currentVal.length > 0 && (
          <div className="mt-1 grid grid-cols-1 gap-1 sm:grid-cols-2 rounded-lg border border-[var(--border)]/70 bg-[var(--surface)] p-2.5 text-xs">
            {validation.rules.map((rule) => (
              <div
                key={rule.id}
                className={`flex items-center gap-1.5 transition-colors ${
                  rule.passed ? 'text-emerald-700 font-medium' : 'text-[var(--ink-muted)]'
                }`}
              >
                {rule.passed ? (
                  <Check size={13} className="shrink-0 text-emerald-600" />
                ) : (
                  <X size={13} className="shrink-0 text-slate-400" />
                )}
                <span>{rule.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Error message */}
        {error && <span className="text-xs text-[var(--danger)]">{error}</span>}

        {/* Helper text */}
        {helperText && !error && (
          <span className="text-xs text-[var(--ink-muted)]">{helperText}</span>
        )}
      </div>
    )
  }
)

PasswordInput.displayName = 'PasswordInput'
