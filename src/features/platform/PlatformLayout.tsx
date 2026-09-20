import { Outlet, useNavigate } from 'react-router-dom'
import { ShieldCheck, LogOut } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { initials } from '@/lib/utils'

export function PlatformLayout() {
  const { session, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-canvas">
      <header className="h-14 sticky top-0 z-30 flex items-center justify-between border-b border-border bg-ink-900 px-4 lg:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white">
            <ShieldCheck className="h-4.5 w-4.5" />
          </div>
          <span className="text-sm font-semibold text-white">Platform Console</span>
          <span className="text-[11px] text-white/40 border border-white/20 rounded px-1.5 py-0.5 ml-1">Tenant Management</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-500 text-white text-xs font-semibold">
            {initials(session?.fullName)}
          </div>
          <span className="text-sm text-white/80 hidden sm:inline">{session?.fullName}</span>
          <button
            onClick={() => { logout(); navigate('/platform/login') }}
            className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </header>
      <main className="p-4 lg:p-6 max-w-[1200px] w-full mx-auto">
        <Outlet />
      </main>
    </div>
  )
}