import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { Button } from '../../components/common/Button'
import { roleHome } from '../../components/common/ProtectedRoute'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { clearAuthError, login } from '../../store/slices/authSlice'
import isaiiCleanLogo from '../../assets/isaii_clean.png'
import sriEshwarCleanLogo from '../../assets/sri_eshwar_clean.png'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

export function Login() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { user, accessToken, status, error } = useAppSelector((s) => s.auth)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  useEffect(() => {
    dispatch(clearAuthError())
  }, [dispatch])

  if (user && accessToken) {
    return <Navigate to={roleHome(user.role)} replace />
  }

  const onSubmit = handleSubmit(async (values) => {
    const result = await dispatch(login(values))
    if (login.fulfilled.match(result)) {
      navigate(roleHome(result.payload.user.role), { replace: true })
    }
  })

  return (
    <div className="flex min-h-screen bg-[var(--surface)]">
      {/* Left branding panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden p-10 lg:flex lg:w-[45%] bg-gradient-to-br from-[var(--primary-blue-deeper)] to-[var(--primary-blue)]">
        {/* Gold decoration */}
        <div
          className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-[var(--gold)] opacity-20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-[var(--gold)] opacity-15 blur-2xl"
          aria-hidden
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          {/* Split College Logo Badge */}
          <div className="flex items-center rounded-2xl bg-white px-3.5 py-1.5 shadow-md border border-white/30">
            <img
              src={sriEshwarCleanLogo}
              alt="Sri Eshwar College Logo"
              className="h-9 w-auto max-w-[140px] object-contain"
            />
          </div>

          {/* Split ISAII Logo Badge (Zoomed) */}
          <div className="flex items-center rounded-2xl bg-white px-3.5 py-1.5 shadow-md border border-white/30">
            <img
              src={isaiiCleanLogo}
              alt="ISAII Logo"
              className="h-9 w-auto max-w-[95px] object-contain scale-120"
            />
          </div>

          <span className="text-xl font-bold text-[var(--white)] ml-1">TMS Portal</span>
        </div>

        {/* Main copy */}
        <div className="relative">
          <p className="font-display text-3xl font-bold leading-snug text-[var(--white)]">
            Manage tickets,<br />
            <span className="text-[var(--gold)]">resolve issues faster.</span>
          </p>
          <p className="mt-4 text-sm leading-relaxed text-white/65">
            Sign in to your staff account to access tickets, manage assignments, and track
            department performance.
          </p>
        </div>

        {/* Bottom info */}
        <p className="relative text-xs text-white/40">
          Secured staff portal · TMS v1.0
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex items-center rounded-xl bg-white px-2.5 py-1 border border-slate-200 shadow-xs">
              <img
                src={sriEshwarCleanLogo}
                alt="Sri Eshwar College Logo"
                className="h-7 w-auto max-w-[110px] object-contain"
              />
            </div>
            <div className="flex items-center rounded-xl bg-white px-2.5 py-1 border border-slate-200 shadow-xs">
              <img
                src={isaiiCleanLogo}
                alt="ISAII Logo"
                className="h-7 w-auto max-w-[70px] object-contain scale-115"
              />
            </div>
            <span className="font-bold text-[var(--ink)]">TMS Portal</span>
          </div>

          <h1 className="font-display text-2xl font-bold text-[var(--ink)]">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Sign in with your work credentials to continue.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-email" className="text-sm font-semibold text-[var(--ink)]">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className={`h-10 w-full rounded-lg border bg-[var(--white)] px-3 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20 ${
                  errors.email ? 'border-[var(--danger)]' : 'border-[var(--border)]'
                }`}
                placeholder="you@company.com"
              />
              {errors.email && (
                <span className="text-xs text-[var(--danger)]">{errors.email.message}</span>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-password" className="text-sm font-semibold text-[var(--ink)]">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
                className={`h-10 w-full rounded-lg border bg-[var(--white)] px-3 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20 ${
                  errors.password ? 'border-[var(--danger)]' : 'border-[var(--border)]'
                }`}
                placeholder="••••••••"
              />
              {errors.password && (
                <span className="text-xs text-[var(--danger)]">{errors.password.message}</span>
              )}
            </div>

            {/* Server error */}
            {error && (
              <div
                className="rounded-lg border border-[var(--danger)]/20 bg-[var(--danger-light)] px-4 py-3 text-sm text-[var(--danger)]"
                role="alert"
              >
                {error}
              </div>
            )}

            <Button
              id="login-submit"
              type="submit"
              className="w-full"
              loading={status === 'loading'}
              size="lg"
            >
              <LogIn size={17} />
              Sign in
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-[var(--ink-muted)]">
            Not a staff member?{' '}
            <Link
              to="/raise-ticket"
              className="font-semibold text-[var(--primary-blue)] hover:underline"
            >
              Raise a ticket
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
