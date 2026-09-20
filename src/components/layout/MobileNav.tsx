import { NavLink } from 'react-router-dom'
import { X, Activity, Palette } from 'lucide-react'
import {
  LayoutDashboard, Users, Stethoscope, Building2, CalendarClock,
  ClipboardList, BedDouble, Receipt, Pill, UserCog, BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/AuthContext'
import { useBranding } from '@/features/branding/BrandingContext'
import { NAV_ACCESS, hasRole } from '@/lib/permissions'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/patients', label: 'Patients', icon: Users },
  { to: '/doctors', label: 'Doctors', icon: Stethoscope },
  { to: '/departments', label: 'Departments', icon: Building2 },
  { to: '/staff', label: 'Staff', icon: UserCog },
  { to: '/appointments', label: 'Appointments', icon: CalendarClock },
  { to: '/opd', label: 'OPD / Consultations', icon: ClipboardList },
  { to: '/ipd', label: 'IPD / Admissions', icon: BedDouble },
  { to: '/billing', label: 'Billing', icon: Receipt },
  { to: '/pharmacy', label: 'Pharmacy', icon: Pill },
  { to: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
]

export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { session } = useAuth()
  const { branding } = useBranding()
  const isAdmin = session?.role === 'HOSPITAL_ADMIN'
  const visibleNav = NAV.filter(item => hasRole(session?.role, NAV_ACCESS[item.to] ?? []))

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-ink-900/40" onClick={onClose} />
      <div className="absolute left-0 top-0 h-full w-64 bg-surface shadow-xl flex flex-col">
        <div className="h-14 flex items-center justify-between px-4 border-b border-border">
          <div className="flex items-center gap-2">
            {branding.logoDataUrl ? (
              <img src={branding.logoDataUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ backgroundColor: 'var(--hms-brand-primary)' }}>
                <Activity className="h-4.5 w-4.5" />
              </div>
            )}
            <span className="text-sm font-semibold">{session?.hospitalName || 'HMS'}</span>
          </div>
          <button onClick={onClose}><X className="h-5 w-5 text-ink-500" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                cn('flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium',
                  isActive ? 'bg-primary-50 text-primary-700' : 'text-ink-600 hover:bg-canvas')
              }
            >
              <item.icon className="h-4 w-4" /> {item.label}
            </NavLink>
          ))}
          {isAdmin && (
            <>
              <div className="pt-3 mt-2 border-t border-border" />
              <NavLink
                to="/settings/branding"
                onClick={onClose}
                className={({ isActive }) =>
                  cn('flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium',
                    isActive ? 'bg-primary-50 text-primary-700' : 'text-ink-600 hover:bg-canvas')
                }
              >
                <Palette className="h-4 w-4" /> Branding
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </div>
  )
}