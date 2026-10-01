import { useState } from 'react'
import { Eye, EyeOff, KeyRound, Lock, X } from 'lucide-react'
import { userService } from '../../services/userService'
import { useToast } from '../../context/ToastContext'
import { useAppSelector } from '../../store/hooks'
import { getErrorMessage } from '../../lib/utils'
import { Button } from './Button'

interface ChangePasswordModalProps {
  onClose: () => void
}

export function ChangePasswordModal({ onClose }: ChangePasswordModalProps) {
  const toast = useToast()
  const user = useAppSelector((s) => s.auth.user)

  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.currentPassword) errs.currentPassword = 'Current password is required'
    if (!form.newPassword || form.newPassword.length < 6)
      errs.newPassword = 'New password must be at least 6 characters'
    if (form.newPassword === form.currentPassword)
      errs.newPassword = 'New password must be different from current password'
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your new password'
    else if (form.newPassword !== form.confirmPassword)
      errs.confirmPassword = 'Passwords do not match'
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    if (!user) return

    setLoading(true)
    try {
      await userService.changePassword(user.id || user._id || '', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })
      toast.success('Password changed successfully!')
      onClose()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to change password'))
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: '' }))
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--white)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[var(--border)] p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-blue-light)]">
            <KeyRound size={20} className="text-[var(--primary-blue)]" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-[var(--ink)]">Change Password</h2>
            <p className="text-xs text-[var(--ink-muted)]">Update your account password</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--ink-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={(e) => void handleSubmit(e)} className="p-5 space-y-4">
          {/* Current Password */}
          <div>
            <label
              htmlFor="cp-current"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]"
            >
              Current Password
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]"
              />
              <input
                id="cp-current"
                type={showCurrent ? 'text' : 'password'}
                value={form.currentPassword}
                onChange={(e) => handleChange('currentPassword', e.target.value)}
                placeholder="Enter current password"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-9 pr-10 text-sm font-medium text-[var(--ink)] outline-none transition focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] hover:text-[var(--ink)] cursor-pointer"
                aria-label={showCurrent ? 'Hide password' : 'Show password'}
              >
                {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="mt-1 text-xs text-[var(--danger)]">{errors.currentPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label
              htmlFor="cp-new"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]"
            >
              New Password
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]"
              />
              <input
                id="cp-new"
                type={showNew ? 'text' : 'password'}
                value={form.newPassword}
                onChange={(e) => handleChange('newPassword', e.target.value)}
                placeholder="Enter new password (min. 6 chars)"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-9 pr-10 text-sm font-medium text-[var(--ink)] outline-none transition focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] hover:text-[var(--ink)] cursor-pointer"
                aria-label={showNew ? 'Hide password' : 'Show password'}
              >
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {/* Strength indicator */}
            {form.newPassword && (
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4].map((i) => {
                  const strength =
                    (form.newPassword.length >= 6 ? 1 : 0) +
                    (/[A-Z]/.test(form.newPassword) ? 1 : 0) +
                    (/[0-9]/.test(form.newPassword) ? 1 : 0) +
                    (/[^A-Za-z0-9]/.test(form.newPassword) ? 1 : 0)
                  const colors = ['bg-[var(--danger)]', 'bg-orange-400', 'bg-[var(--gold)]', 'bg-[var(--success)]']
                  return (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? colors[strength - 1] : 'bg-[var(--border)]'}`}
                    />
                  )
                })}
              </div>
            )}
            {errors.newPassword && (
              <p className="mt-1 text-xs text-[var(--danger)]">{errors.newPassword}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="cp-confirm"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]"
            >
              Confirm New Password
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]"
              />
              <input
                id="cp-confirm"
                type={showConfirm ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                placeholder="Confirm new password"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-9 pr-10 text-sm font-medium text-[var(--ink)] outline-none transition focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] hover:text-[var(--ink)] cursor-pointer"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {form.confirmPassword && form.newPassword !== form.confirmPassword && (
              <p className="mt-1 text-xs text-[var(--danger)]">Passwords do not match</p>
            )}
            {form.confirmPassword && form.newPassword === form.confirmPassword && (
              <p className="mt-1 text-xs text-[var(--success)]">✓ Passwords match</p>
            )}
            {errors.confirmPassword && !form.confirmPassword && (
              <p className="mt-1 text-xs text-[var(--danger)]">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] py-2.5 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <Button
              type="submit"
              id="change-password-submit"
              loading={loading}
              className="flex-1"
            >
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
