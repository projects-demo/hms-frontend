import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function ProtectedRoute() {
  const { isAuthenticated, isPlatformAdmin } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  // A platform-admin session has no hospital context (no tenantCode) - every hospital
  // API call would 403 anyway, so redirect them straight to their own portal instead
  // of letting them land on broken/empty hospital screens.
  if (isPlatformAdmin) {
    return <Navigate to="/platform" replace />
  }
  return <Outlet />
}