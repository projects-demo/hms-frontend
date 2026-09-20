import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { BrandingProvider, useBranding } from '@/features/branding/BrandingContext'

function AnnouncementBanner() {
  const { branding } = useBranding()
  if (!branding.headerBannerText) return null
  return (
    <div
      className="px-4 lg:px-6 py-2 text-center text-sm font-medium text-white"
      style={{ backgroundColor: 'var(--hms-brand-accent)' }}
    >
      {branding.headerBannerText}
    </div>
  )
}

function Footer() {
  const { branding } = useBranding()
  if (!branding.footerText) return null
  return (
    <footer className="border-t border-border px-4 lg:px-6 py-4 text-center text-xs text-ink-400">
      {branding.footerText}
    </footer>
  )
}

function LayoutInner() {
  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar />
        <AnnouncementBanner />
        <main className="flex-1 p-4 lg:p-6 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  )
}

export function AppLayout() {
  return (
    <BrandingProvider>
      <LayoutInner />
    </BrandingProvider>
  )
}