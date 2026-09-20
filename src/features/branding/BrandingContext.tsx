import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { brandingApi } from '@/lib/services/branding'
import type { Branding } from '@/types/domain'

const EMPTY: Branding = { logoDataUrl: null, primaryColor: null, accentColor: null, headerBannerText: null, footerText: null }

interface BrandingContextValue {
  branding: Branding
  loading: boolean
  refresh: () => void
}

const BrandingContext = createContext<BrandingContextValue | null>(null)

/**
 * Loaded once per hospital session (mounted inside AppLayout, so platform-admin
 * sessions never touch this). Applies primaryColor/accentColor as CSS variable
 * overrides scoped to just the logo box and header banner - see index.css for
 * why the whole design system's color tokens are deliberately NOT touched here.
 */
export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<Branding>(EMPTY)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    setLoading(true)
    brandingApi.get()
      .then(setBranding)
      .catch(() => setBranding(EMPTY))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { refresh() }, [refresh])

  useEffect(() => {
    const root = document.documentElement
    if (branding.primaryColor) root.style.setProperty('--hms-brand-primary', branding.primaryColor)
    else root.style.removeProperty('--hms-brand-primary')
    if (branding.accentColor) root.style.setProperty('--hms-brand-accent', branding.accentColor)
    else root.style.removeProperty('--hms-brand-accent')
    return () => {
      root.style.removeProperty('--hms-brand-primary')
      root.style.removeProperty('--hms-brand-accent')
    }
  }, [branding.primaryColor, branding.accentColor])

  return (
    <BrandingContext.Provider value={{ branding, loading, refresh }}>
      {children}
    </BrandingContext.Provider>
  )
}

export function useBranding() {
  const ctx = useContext(BrandingContext)
  if (!ctx) throw new Error('useBranding must be used within BrandingProvider')
  return ctx
}