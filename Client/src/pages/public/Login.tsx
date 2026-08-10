import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate, useNavigate } from 'react-router-dom'
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
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-md flex-col justify-center px-4 py-10">
      <div className="panel p-6 sm:p-8">
        <p className="font-display text-3xl font-semibold text-navy">TMS</p>
        <h1 className="mt-2 text-xl font-semibold text-ink">Staff sign in</h1>
        <p className="mt-1 text-sm text-slate-600">Use your work credentials to continue.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Email</span>
            <input
              type="email"
              autoComplete="email"
              {...register('email')}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-accent"
            />
            {errors.email && (
              <span className="mt-1 block text-xs text-red-600">{errors.email.message}</span>
            )}
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              {...register('password')}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-accent"
            />
            {errors.password && (
              <span className="mt-1 block text-xs text-red-600">{errors.password.message}</span>
            )}
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <Button type="submit" className="w-full" loading={status === 'loading'} size="lg">
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Public user?{' '}
          <Link to="/raise-ticket" className="font-medium text-accent hover:underline">
            Raise a ticket
          </Link>
        </p>
      </div>
    </div>
  )
}
