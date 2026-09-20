import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'

/**
 * Guards /platform/* routes. Deliberately stricter than the hospital ProtectedRoute -
 * a logged-in hospital admin must NOT be able to reach tenant management just by
 * knowing the URL, so this checks session.platform === true, not just "any session".
 */
export function PlatformProtectedRoute() {
  const { isAuthenticated, isPlatformAdmin } = useAuth()
  if (!isAuthenticated || !isPlatformAdmin) {
    return <Navigate to="/platform/login" replace />
  }
  return <Outlet />
}