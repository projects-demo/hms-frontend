import { useState } from 'react'
import { Plus, Building2, Ban, RotateCcw, PowerOff } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination } from '@/components/common/Pagination'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Card } from '@/components/ui/Card'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select, SelectItem } from '@/components/ui/Select'
import { usePaginated } from '@/hooks/usePaginated'
import { tenantsApi, type OnboardTenantRequest } from '@/lib/services/platform'
import type { Tenant, TenantStatus } from '@/types/domain'
import { formatDate } from '@/lib/utils'
import { apiErrorMessage } from '@/lib/api-client'
import { toast } from 'sonner'

const EMPTY_FORM: OnboardTenantRequest = {
  tenantCode: '', hospitalName: '', legalName: '', contactEmail: '', contactPhone: '',
  addressLine1: '', city: '', state: '', postalCode: '',
  adminUsername: '', adminFullName: '', adminPassword: '',
}

export default function TenantsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState<OnboardTenantRequest>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const [suspendTarget, setSuspendTarget] = useState<Tenant | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<Tenant | null>(null)
  const [actioning, setActioning] = useState(false)

  const { data, loading, page, setPage, reload } = usePaginated(
    (page, size) => tenantsApi.list({ status: statusFilter as TenantStatus | 'ALL', page, size }),
    [statusFilter],
  )

  function set<K extends keyof OnboardTenantRequest>(key: K, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleOnboard() {
    if (!form.tenantCode || !form.hospitalName || !form.contactEmail || !form.adminUsername || !form.adminFullName || !form.adminPassword) {
      toast.error('Please fill in all required fields'); return
    }
    if (form.adminPassword.length < 8) {
      toast.error('Admin password must be at least 8 characters'); return
    }
    setSaving(true)
    try {
      const tenant = await tenantsApi.onboard(form)
      toast.success(`${tenant.hospitalName} onboarded - schema ${tenant.schemaName} is ready`)
      setCreateOpen(false)
      setForm(EMPTY_FORM)
      reload()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleSuspend() {
    if (!suspendTarget) return
    setActioning(true)
    try {
      await tenantsApi.suspend(suspendTarget.id)
      toast.success(`${suspendTarget.hospitalName} suspended`)
      setSuspendTarget(null)
      reload()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setActioning(false)
    }
  }

  async function handleReactivate(tenant: Tenant) {
    try {
      await tenantsApi.reactivate(tenant.id)
      toast.success(`${tenant.hospitalName} reactivated`)
      reload()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  async function handleDeactivate() {
    if (!deactivateTarget) return
    setActioning(true)
    try {
      await tenantsApi.deactivate(deactivateTarget.id)
      toast.success(`${deactivateTarget.hospitalName} offboarded`)
      setDeactivateTarget(null)
      reload()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setActioning(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Hospitals"
        description="Onboard new hospitals and manage tenant access."
        actions={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Onboard hospital</Button>}
      />

      <Card>
        <div className="p-4 border-b border-border">
          <Select value={statusFilter} onValueChange={setStatusFilter} className="w-48">
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="PROVISIONING">Provisioning</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
            <SelectItem value="DEACTIVATED">Deactivated</SelectItem>
          </Select>
        </div>

        {loading ? <PageSpinner /> : !data || data.content.length === 0 ? (
          <EmptyState icon={<Building2 className="h-10 w-10" />} title="No hospitals yet"
            description="Onboard your first hospital - this creates its own isolated database schema and its admin login."
            action={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Onboard hospital</Button>}
          />
        ) : (
          <>
            <Table>
              <THead><TR><TH>Hospital</TH><TH>Tenant code</TH><TH>Contact</TH><TH>Plan</TH><TH>Onboarded</TH><TH>Status</TH><TH></TH></TR></THead>
              <TBody>
                {data.content.map(t => (
                  <TR key={t.id}>
                    <TD className="font-medium text-ink-900">{t.hospitalName}</TD>
                    <TD className="font-mono text-xs">{t.tenantCode}</TD>
                    <TD className="text-ink-500">{t.contactEmail}</TD>
                    <TD>{t.subscriptionPlan}</TD>
                    <TD className="text-ink-500">{formatDate(t.createdAt)}</TD>
                    <TD><StatusBadge status={t.status} /></TD>
                    <TD className="text-right">
                      <div className="flex justify-end gap-2">
                        {t.status === 'ACTIVE' && (
                          <Button size="sm" variant="outline" onClick={() => setSuspendTarget(t)}>
                            <Ban className="h-3.5 w-3.5" /> Suspend
                          </Button>
                        )}
                        {(t.status === 'SUSPENDED' || t.status === 'DEACTIVATED') && (
                          <Button size="sm" variant="outline" onClick={() => handleReactivate(t)}>
                            <RotateCcw className="h-3.5 w-3.5" /> Reactivate
                          </Button>
                        )}
                        {t.status !== 'DEACTIVATED' && (
                          <Button size="sm" variant="danger" onClick={() => setDeactivateTarget(t)}>
                            <PowerOff className="h-3.5 w-3.5" /> Offboard
                          </Button>
                        )}
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <Pagination page={page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
          </>
        )}
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent title="Onboard a new hospital" description="Creates a dedicated schema, runs migrations, and seeds the hospital's first admin login." className="max-w-2xl">
          <div className="space-y-5">
            <section>
              <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">Hospital details</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tenant code *</Label>
                  <Input value={form.tenantCode} onChange={(e) => set('tenantCode', e.target.value)} placeholder="e.g. motherland-noida" />
                </div>
                <div><Label>Hospital name *</Label><Input value={form.hospitalName} onChange={(e) => set('hospitalName', e.target.value)} /></div>
                <div><Label>Legal name</Label><Input value={form.legalName} onChange={(e) => set('legalName', e.target.value)} /></div>
                <div><Label>Contact email *</Label><Input type="email" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} /></div>
                <div><Label>Contact phone</Label><Input value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} /></div>
                <div><Label>Postal code</Label><Input value={form.postalCode} onChange={(e) => set('postalCode', e.target.value)} /></div>
                <div className="col-span-2"><Label>Address</Label><Input value={form.addressLine1} onChange={(e) => set('addressLine1', e.target.value)} /></div>
                <div><Label>City</Label><Input value={form.city} onChange={(e) => set('city', e.target.value)} /></div>
                <div><Label>State</Label><Input value={form.state} onChange={(e) => set('state', e.target.value)} /></div>
              </div>
            </section>
            <section>
              <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">First admin login</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Username *</Label><Input value={form.adminUsername} onChange={(e) => set('adminUsername', e.target.value)} /></div>
                <div><Label>Full name *</Label><Input value={form.adminFullName} onChange={(e) => set('adminFullName', e.target.value)} /></div>
                <div className="col-span-2">
                  <Label>Password * <span className="text-ink-400 font-normal">(min. 8 characters)</span></Label>
                  <Input type="password" value={form.adminPassword} onChange={(e) => set('adminPassword', e.target.value)} />
                </div>
              </div>
            </section>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleOnboard} loading={saving}>Onboard hospital</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!suspendTarget}
        onOpenChange={(o) => !o && setSuspendTarget(null)}
        title={`Suspend ${suspendTarget?.hospitalName ?? ''}?`}
        description="Blocks all of this hospital's staff from logging in immediately. Reversible - reactivate anytime."
        confirmLabel="Suspend"
        destructive
        onConfirm={handleSuspend}
        loading={actioning}
      />

      <ConfirmDialog
        open={!!deactivateTarget}
        onOpenChange={(o) => !o && setDeactivateTarget(null)}
        title={`Offboard ${deactivateTarget?.hospitalName ?? ''}?`}
        description="Blocks all logins indefinitely. Their data and schema are preserved (never deleted) and this can still be reversed via Reactivate later."
        confirmLabel="Offboard hospital"
        destructive
        onConfirm={handleDeactivate}
        loading={actioning}
      />
    </div>
  )
}