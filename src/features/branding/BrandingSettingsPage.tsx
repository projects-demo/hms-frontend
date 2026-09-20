import { useEffect, useRef, useState } from 'react'
import { Upload, Trash2, Palette, Image as ImageIcon } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'
import { Input } from '@/components/ui/Input'
import { PageSpinner } from '@/components/ui/Spinner'
import { brandingApi } from '@/lib/services/branding'
import { useBranding } from './BrandingContext'
import type { Branding } from '@/types/domain'
import { apiErrorMessage } from '@/lib/api-client'
import { toast } from 'sonner'

const MAX_LOGO_BYTES = 800 * 1024 // ~800KB raw file - keeps the resulting base64 payload well under 1.5MB
const DEFAULT_PRIMARY = '#14635B'
const DEFAULT_ACCENT = '#FB6F45'

export default function BrandingSettingsPage() {
  const { branding, loading, refresh } = useBranding()
  const [form, setForm] = useState<Branding>(branding)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (!loading) setForm(branding) }, [loading, branding])

  function handleLogoFile(file: File) {
    if (!file.type.startsWith('image/')) { toast.error('Please choose an image file'); return }
    if (file.size > MAX_LOGO_BYTES) { toast.error('Logo must be under 800KB - try a smaller or more compressed image'); return }
    const reader = new FileReader()
    reader.onload = () => setForm(f => ({ ...f, logoDataUrl: reader.result as string }))
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await brandingApi.update(form)
      toast.success('Branding updated')
      refresh()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageSpinner />

  return (
    <div>
      <PageHeader
        title="Branding"
        description="Light customization for this hospital's portal - logo, accent color, and announcement text. Visible to all your staff."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader><CardTitle>Logo</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-border-strong bg-canvas overflow-hidden shrink-0">
                  {form.logoDataUrl ? (
                    <img src={form.logoDataUrl} alt="Logo preview" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-ink-400" />
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-3.5 w-3.5" /> Upload logo
                  </Button>
                  {form.logoDataUrl && (
                    <Button variant="ghost" size="sm" onClick={() => setForm(f => ({ ...f, logoDataUrl: null }))}>
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </Button>
                  )}
                  <input
                    ref={fileInputRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleLogoFile(e.target.files[0])}
                  />
                </div>
              </div>
              <p className="text-xs text-ink-400 mt-3">Square images work best. Max 800KB, PNG or JPG recommended.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Colors</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Primary color</Label>
                  <p className="text-xs text-ink-400 mb-1.5">Used for the logo box background.</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="color" value={form.primaryColor || DEFAULT_PRIMARY}
                      onChange={(e) => setForm(f => ({ ...f, primaryColor: e.target.value }))}
                      className="h-9 w-12 rounded-md border border-border-strong cursor-pointer"
                    />
                    <Input value={form.primaryColor || ''} placeholder={DEFAULT_PRIMARY}
                      onChange={(e) => setForm(f => ({ ...f, primaryColor: e.target.value || null }))} className="font-mono text-xs" />
                  </div>
                </div>
                <div>
                  <Label>Accent color</Label>
                  <p className="text-xs text-ink-400 mb-1.5">Used for the announcement banner.</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="color" value={form.accentColor || DEFAULT_ACCENT}
                      onChange={(e) => setForm(f => ({ ...f, accentColor: e.target.value }))}
                      className="h-9 w-12 rounded-md border border-border-strong cursor-pointer"
                    />
                    <Input value={form.accentColor || ''} placeholder={DEFAULT_ACCENT}
                      onChange={(e) => setForm(f => ({ ...f, accentColor: e.target.value || null }))} className="font-mono text-xs" />
                  </div>
                </div>
              </div>
              {(form.primaryColor || form.accentColor) && (
                <Button variant="ghost" size="sm" className="mt-3" onClick={() => setForm(f => ({ ...f, primaryColor: null, accentColor: null }))}>
                  Reset to default colors
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Announcement banner</CardTitle></CardHeader>
            <CardContent>
              <Label>Shown as a strip below the top bar on every page</Label>
              <Input
                value={form.headerBannerText || ''}
                onChange={(e) => setForm(f => ({ ...f, headerBannerText: e.target.value || null }))}
                placeholder="e.g. Free health checkup camp this Sunday, 9am–1pm"
                maxLength={500}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Footer text</CardTitle></CardHeader>
            <CardContent>
              <Label>Shown at the bottom of every page</Label>
              <Input
                value={form.footerText || ''}
                onChange={(e) => setForm(f => ({ ...f, footerText: e.target.value || null }))}
                placeholder="e.g. © 2026 Motherland Noida Hospital · Emergency: 1800-XXX-XXXX"
                maxLength={500}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} loading={saving} size="lg">Save branding</Button>
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader><CardTitle className="flex items-center gap-1.5"><Palette className="h-3.5 w-3.5" /> Live preview</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="rounded-b-xl overflow-hidden border-t border-border">
                <div className="h-11 flex items-center gap-2 px-3 bg-surface border-b border-border">
                  {form.logoDataUrl ? (
                    <img src={form.logoDataUrl} alt="" className="h-6 w-6 rounded object-cover" />
                  ) : (
                    <div className="h-6 w-6 rounded flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: form.primaryColor || DEFAULT_PRIMARY }}>H</div>
                  )}
                  <span className="text-xs font-semibold text-ink-900">Your Hospital</span>
                </div>
                {form.headerBannerText && (
                  <div className="px-3 py-1.5 text-center text-[11px] font-medium text-white truncate" style={{ backgroundColor: form.accentColor || DEFAULT_ACCENT }}>
                    {form.headerBannerText}
                  </div>
                )}
                <div className="h-16 bg-canvas" />
                {form.footerText && (
                  <div className="border-t border-border px-3 py-2 text-center text-[10px] text-ink-400 truncate">
                    {form.footerText}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}