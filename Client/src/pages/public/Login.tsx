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
    <div
      className="flex min-h-[calc(100vh-3.5rem)]"
      style={{ background: 'var(--surface)' }}
    >
      {/* Left branding panel */}
      <div
        className="relative hidden flex-col justify-between overflow-hidden p-10 lg:flex lg:w-[45%]"
        style={{ background: 'linear-gradient(160deg, var(--primary-blue-deeper) 0%, var(--primary-blue) 100%)' }}
      >
        {/* Gold decoration */}
        <div
          className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full opacity-20 blur-3xl"
          style={{ background: 'var(--gold)' }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full opacity-15 blur-2xl"
          style={{ background: 'var(--gold)' }}
          aria-hidden
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold"
            style={{ background: 'var(--gold)', color: 'var(--primary-blue-deeper)' }}
          >
            TM
          </div>
          <span className="text-lg font-bold text-white">TMS Portal</span>
        </div>

        {/* Main copy */}
        <div className="relative">
          <p className="font-display text-3xl font-bold leading-snug text-white">
            Manage tickets,<br />
            <span style={{ color: 'var(--gold)' }}>resolve issues faster.</span>
          </p>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: 'rgb(255 255 255 / 0.65)' }}>
            Sign in to your staff account to access tickets, manage assignments, and track
            department performance.
          </p>
        </div>

        {/* Bottom info */}
        <p className="relative text-xs" style={{ color: 'rgb(255 255 255 / 0.4)' }}>
          Secured staff portal · TMS v1.0
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold"
              style={{ background: 'var(--primary-blue)', color: 'var(--white)' }}
            >
              TM
            </div>
            <span className="font-bold" style={{ color: 'var(--ink)' }}>TMS Portal</span>
          </div>

          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--ink)' }}>
            Welcome back
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--ink-muted)' }}>
            Sign in with your work credentials to continue.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
            {/* Email */}
            <div className="form-field">
              <label htmlFor="login-email" className="form-label">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className={`input-field ${errors.email ? 'input-error' : ''}`}
                placeholder="you@company.com"
              />
              {errors.email && (
                <span className="form-error">{errors.email.message}</span>
              )}
            </div>

            {/* Password */}
            <div className="form-field">
              <label htmlFor="login-password" className="form-label">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
                className={`input-field ${errors.password ? 'input-error' : ''}`}
                placeholder="••••••••"
              />
              {errors.password && (
                <span className="form-error">{errors.password.message}</span>
              )}
            </div>

            {/* Server error */}
            {error && (
              <div
                className="rounded-lg px-4 py-3 text-sm"
                style={{
                  background: 'var(--danger-light)',
                  color: 'var(--danger)',
                  border: '1px solid rgb(220 38 38 / 0.2)',
                }}
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

          <p className="mt-8 text-center text-sm" style={{ color: 'var(--ink-muted)' }}>
            Not a staff member?{' '}
            <Link
              to="/raise-ticket"
              className="font-semibold hover:underline"
              style={{ color: 'var(--primary-blue)' }}
            >
              Raise a ticket
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
