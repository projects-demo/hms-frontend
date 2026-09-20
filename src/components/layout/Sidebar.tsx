import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Stethoscope, Building2, CalendarClock,
  ClipboardList, BedDouble, Receipt, Pill, UserCog, Activity, BarChart3, Palette,
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

export function Sidebar() {
  const { session } = useAuth()
  const { branding } = useBranding()
  const isAdmin = session?.role === 'HOSPITAL_ADMIN'
  const visibleNav = NAV.filter(item => hasRole(session?.role, NAV_ACCESS[item.to] ?? []))

  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border bg-surface h-screen sticky top-0">
      <div className="h-14 flex items-center gap-2 px-4 border-b border-border">
        {branding.logoDataUrl ? (
          <img src={branding.logoDataUrl} alt="" className="h-8 w-8 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white shrink-0" style={{ backgroundColor: 'var(--hms-brand-primary)' }}>
            <Activity className="h-4.5 w-4.5" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-900 leading-tight truncate">
            {session?.hospitalName || 'HMS'}
          </p>
          <p className="text-[11px] text-ink-400 leading-tight">Hospital Management</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2 space-y-0.5">
        {visibleNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-primary-50 text-primary-700' : 'text-ink-600 hover:bg-canvas hover:text-ink-900',
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="pt-3 mt-2 border-t border-border" />
            <NavLink
              to="/settings/branding"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-primary-50 text-primary-700' : 'text-ink-600 hover:bg-canvas hover:text-ink-900',
                )
              }
            >
              <Palette className="h-4 w-4 shrink-0" />
              Branding
            </NavLink>
          </>
        )}
      </nav>

      <div className="p-3 border-t border-border">
        <p className="text-[11px] text-ink-400 px-1">Tenant code</p>
        <p className="text-xs font-mono text-ink-600 px-1 truncate">{session?.tenantCode}</p>
      </div>
    </aside>
  )
}