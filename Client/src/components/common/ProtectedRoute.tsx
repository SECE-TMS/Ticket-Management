import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAppSelector } from '../../store/hooks'
import { PageLoader } from './LoadingSpinner'
import type { Role } from '../../types'

export function ProtectedRoute() {
  const { accessToken, user, status } = useAppSelector((s) => s.auth)
  const location = useLocation()

  if (status === 'loading') return <PageLoader />

  if (!accessToken || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

export function RoleRoute({ allow }: { allow: Role[] }) {
  const { user, status } = useAppSelector((s) => s.auth)

  if (status === 'loading') return <PageLoader />
  if (!user) return <Navigate to="/login" replace />

  if (!allow.includes(user.role)) {
    const dest =
      user.role === 'admin'
        ? '/admin/dashboard'
        : user.role === 'manager'
          ? '/manager/dashboard'
          : '/employee/dashboard'
    return <Navigate to={dest} replace />
  }

  return <Outlet />
}

export function roleHome(role: Role) {
  if (role === 'admin') return '/admin/dashboard'
  if (role === 'manager') return '/manager/dashboard'
  return '/employee/dashboard'
}
