import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse, ApiErrorBody } from '@/types/api'

declare global {
  interface Window { __HMS_CONFIG__?: { API_BASE_URL?: string } }
}

// Runtime config (set by the Docker container's entrypoint from an env var) takes
// priority over the build-time Vite env var, which only matters for local dev -
// see public/config.template.js for why this exists.
export const API_BASE_URL =
  window.__HMS_CONFIG__?.API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8080'

// ─── Per-tab session keys ────────────────────────────────────────────────────
// We use sessionStorage (scoped to each browser tab) so that opening admin in
// one tab and nurse in another tab keeps their sessions completely isolated.
// The only data kept in localStorage is the refresh token for the *current*
// session so the page survives a manual F5, but a full new tab starts fresh.
const TOKEN_KEY = 'hms.accessToken'
const REFRESH_KEY = 'hms.refreshToken'
const SESSION_KEY = 'hms.session' // tenantCode, hospitalName, username, fullName, role

export interface StoredSession {
  tenantCode: string | null
  hospitalName: string | null
  username: string
  fullName: string
  role: string
  platform: boolean
  // Backend user id — stored so doctor / nurse views can scope queries
  userId?: number
  // For doctors: the doctor profile id (used to filter appointments/consultations)
  doctorId?: number
}

/** Thin wrapper around sessionStorage so each browser tab has its own session. */
export const authStorage = {
  getAccessToken: () => sessionStorage.getItem(TOKEN_KEY),
  getRefreshToken: () => sessionStorage.getItem(REFRESH_KEY),
  getSession: (): StoredSession | null => {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  },
  setSession: (accessToken: string, refreshToken: string, session: StoredSession) => {
    sessionStorage.setItem(TOKEN_KEY, accessToken)
    sessionStorage.setItem(REFRESH_KEY, refreshToken)
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  },
  setAccessToken: (accessToken: string) => sessionStorage.setItem(TOKEN_KEY, accessToken),
  clear: () => {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(REFRESH_KEY)
    sessionStorage.removeItem(SESSION_KEY)
  },
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Cleaned request interceptor mapping tenantCode securely
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // 1. DYNAMIC TENANT SWITCHING: Inject the X-Tenant-ID header
  if (config.url?.includes('/auth/login') && config.data?.tenantCode) {
    config.headers.set('X-Tenant-ID', config.data.tenantCode.trim())
  } else if (config.url?.includes('/platform/auth/login')) {
    config.headers.set('X-Tenant-ID', 'hms_master')
  } else {
    // For all subsequent dashboard API calls
    const currentSession = authStorage.getSession()
    if (currentSession && currentSession.tenantCode) {
      config.headers.set('X-Tenant-ID', currentSession.tenantCode)
    } else if (currentSession?.platform || config.url?.includes('/api/v1/platform')) {
      config.headers.set('X-Tenant-ID', 'hms_master')
    }
  }

  // 2. Token Injection
  const token = authStorage.getAccessToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

// Single-flight refresh so concurrent 401s don't each trigger their own refresh call.
let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = authStorage.getRefreshToken()
  if (!refreshToken) return null
  try {
    const res = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
      `${API_BASE_URL}/api/v1/auth/refresh`,
      { refreshToken },
    )
    const { accessToken, refreshToken: newRefresh } = res.data.data
    authStorage.setAccessToken(accessToken)
    sessionStorage.setItem(REFRESH_KEY, newRefresh)
    return accessToken
  } catch {
    return null
  }
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined

    if (error.response?.status === 401 && original && !original._retried && !original.url?.includes('/auth/')) {
      original._retried = true
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => { refreshPromise = null })
      }
      const newToken = await refreshPromise
      if (newToken) {
        original.headers.set('Authorization', `Bearer ${newToken}`)
        return apiClient(original)
      }
      const wasPlatform = authStorage.getSession()?.platform
      authStorage.clear()
      window.location.href = wasPlatform ? '/platform/login' : '/login'
    }

    return Promise.reject(error)
  },
)

/** Extracts a human-readable message from any API error, including validation field errors. */
export function apiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as ApiErrorBody | undefined
    if (body?.fieldErrors?.length) {
      return body.fieldErrors.map(fe => `${fe.field}: ${fe.message}`).join('; ')
    }
    if (body?.message) return body.message
    if (err.message) return err.message
  }
  if (err instanceof Error) return err.message
  return 'Something went wrong. Please try again.'
}
