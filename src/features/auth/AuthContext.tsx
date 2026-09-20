import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { authApi } from '@/lib/services/auth'
import { platformAuthApi } from '@/lib/services/platform'
import { authStorage, type StoredSession } from '@/lib/api-client'

interface AuthContextValue {
  session: StoredSession | null
  isAuthenticated: boolean
  isPlatformAdmin: boolean
  login: (tenantCode: string, username: string, password: string) => Promise<void>
  loginPlatform: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(authStorage.getSession())

  const login = useCallback(async (tenantCode: string, username: string, password: string) => {
    const res = await authApi.login(tenantCode, username, password)
    const newSession: StoredSession = {
      tenantCode: res.tenantCode,
      hospitalName: res.hospitalName,
      username: res.username,
      fullName: res.fullName,
      role: res.role,
      platform: false,
    }
    authStorage.setSession(res.accessToken, res.refreshToken, newSession)
    setSession(newSession)
  }, [])

  // Separate entry point for the platform-admin portal (/platform/login) - no hospital
  // code involved, and the resulting session is flagged `platform: true` so the two
  // portals (hospital app vs. tenant-management console) never bleed into each other.
  const loginPlatform = useCallback(async (username: string, password: string) => {
    const res = await platformAuthApi.login(username, password)
    const newSession: StoredSession = {
      tenantCode: null,
      hospitalName: null,
      username: res.username,
      fullName: res.fullName,
      role: res.role,
      platform: true,
    }
    authStorage.setSession(res.accessToken, res.refreshToken, newSession)
    setSession(newSession)
  }, [])

  const logout = useCallback(() => {
    authStorage.clear()
    setSession(null)
  }, [])

  const isPlatformAdmin = !!session?.platform

  return (
    <AuthContext.Provider value={{ session, isAuthenticated: !!session, isPlatformAdmin, login, loginPlatform, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}