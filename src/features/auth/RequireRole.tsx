import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { Role } from '@/types/domain'
import { useAuth } from './AuthContext'
import { hasRole } from '@/lib/permissions'

/**
 * Blocks direct URL access to a role-restricted page (not just hiding the
 * sidebar link). Wrap any route that shouldn't be reachable by every role -
 * see App.tsx for which routes use this.
 */
export function RequireRole({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { session } = useAuth()
  if (!hasRole(session?.role, allow)) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}