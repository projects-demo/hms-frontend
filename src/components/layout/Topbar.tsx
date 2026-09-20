import { useState } from 'react'
import { LogOut, Menu, ChevronDown } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useAuth } from '@/features/auth/AuthContext'
import { useNavigate } from 'react-router-dom'
import { initials, toTitleCase } from '@/lib/utils'
import { MobileNav } from './MobileNav'

export function Topbar() {
  const { session, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="h-14 sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-surface/90 backdrop-blur px-4 lg:px-6">
      <button className="lg:hidden text-ink-600" onClick={() => setMobileOpen(true)}>
        <Menu className="h-5 w-5" />
      </button>
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="hidden lg:block" />

      <DropdownMenu.Root>
        <DropdownMenu.Trigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-canvas transition-colors outline-none">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-500 text-white text-xs font-semibold">
            {initials(session?.fullName)}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-medium text-ink-900 leading-tight">{session?.fullName}</p>
            <p className="text-[11px] text-ink-400 leading-tight">{toTitleCase(session?.role)}</p>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-ink-400" />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="end" sideOffset={8} className="z-50 min-w-[180px] rounded-lg border border-border bg-surface shadow-lg p-1">
            <div className="px-2.5 py-2 border-b border-border mb-1">
              <p className="text-xs font-medium text-ink-900">{session?.username}</p>
              <p className="text-[11px] text-ink-400">{session?.hospitalName}</p>
            </div>
            <DropdownMenu.Item
              className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-danger-600 hover:bg-danger-50 cursor-pointer outline-none"
              onSelect={() => { logout(); navigate('/login') }}
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </header>
  )
}
