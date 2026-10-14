import { useState } from 'react'
import { Plus, UserCog } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination } from '@/components/common/Pagination'
import { Card } from '@/components/ui/Card'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select, SelectItem } from '@/components/ui/Select'
import { usePaginated } from '@/hooks/usePaginated'
import { staffApi, type StaffRequest } from '@/lib/services/staff'
import { toTitleCase } from '@/lib/utils'
import { apiErrorMessage } from '@/lib/api-client'
import { toast } from 'sonner'
import { PhoneInput } from '@/components/common/PhoneInput'
import { FieldError } from '@/components/common/FieldError'
import { emailError, phoneError, requiredError } from '@/lib/validation'

const STAFF_TYPES = ['NURSE', 'RECEPTIONIST', 'BILLING_STAFF', 'PHARMACIST', 'LAB_TECH']
const EMPTY: StaffRequest = { username: '', email: '', password: '', fullName: '', phone: '', staffType: 'NURSE', shift: '' }

export default function StaffPage() {
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState<StaffRequest>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data, loading, page, setPage, reload } = usePaginated(
    (page, size) => staffApi.list({ staffType: typeFilter === 'ALL' ? undefined : typeFilter, page, size }),
    [typeFilter],
  )

  function set<K extends keyof StaffRequest>(key: K, value: StaffRequest[K]) {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(current => ({ ...current, [key]: '' }))
  }

  async function handleCreate() {
    const nextErrors = {
      username: requiredError(form.username ?? '', 'Username') ?? '',
      email: emailError(form.email ?? '', true) ?? '',
      password: !form.password ? 'Password is required.' : form.password.length < 8 ? 'Password must be at least 8 characters.' : '',
      fullName: requiredError(form.fullName ?? '', 'Full name') ?? '',
      phone: phoneError(form.phone ?? '') ?? '',
    }
    setErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) { toast.error('Please correct the highlighted fields'); return }
    setSaving(true)
    try {
      await staffApi.create(form)
      toast.success('Staff member onboarded')
      setCreateOpen(false)
      setForm(EMPTY)
      setErrors({})
      reload()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Staff"
        description="Nurses, receptionists, billing staff, pharmacists and lab technicians."
        actions={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Onboard staff</Button>}
      />

      <Card>
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter} className="w-52">
            <SelectItem value="ALL">All staff types</SelectItem>
            {STAFF_TYPES.map(t => <SelectItem key={t} value={t}>{toTitleCase(t)}</SelectItem>)}
          </Select>
        </div>

        {loading ? <PageSpinner /> : !data || data.content.length === 0 ? (
          <EmptyState icon={<UserCog className="h-10 w-10" />} title="No staff onboarded yet"
            action={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Onboard staff</Button>} />
        ) : (
          <>
            <Table>
              <THead><TR><TH>Code</TH><TH>Type</TH><TH>Shift</TH><TH>Joining date</TH><TH>Status</TH></TR></THead>
              <TBody>
                {data.content.map(s => (
                  <TR key={s.id}>
                    <TD className="font-mono text-xs">{s.staffCode}</TD>
                    <TD className="font-medium text-ink-900">{toTitleCase(s.staffType)}</TD>
                    <TD>{s.shift || '—'}</TD>
                    <TD>{s.joiningDate || '—'}</TD>
                    <TD><Badge variant={s.active ? 'success' : 'danger'}>{s.active ? 'Active' : 'Inactive'}</Badge></TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <Pagination page={page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
          </>
        )}
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent title="Onboard staff member" description="Creates their login and profile together.">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Username *</Label><Input required maxLength={50} aria-invalid={!!errors.username} error={!!errors.username} value={form.username} onChange={(e) => set('username', e.target.value)} /><FieldError message={errors.username} /></div>
              <div><Label>Password *</Label><Input required minLength={8} type="password" aria-invalid={!!errors.password} error={!!errors.password} value={form.password} onChange={(e) => set('password', e.target.value)} /><FieldError message={errors.password} /></div>
              <div className="col-span-2"><Label>Full name *</Label><Input required maxLength={150} aria-invalid={!!errors.fullName} error={!!errors.fullName} value={form.fullName} onChange={(e) => set('fullName', e.target.value)} /><FieldError message={errors.fullName} /></div>
              <div className="col-span-2"><Label>Email *</Label><Input required type="email" maxLength={150} aria-invalid={!!errors.email} error={!!errors.email} value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} /><FieldError message={errors.email} /></div>
              <div><Label>Phone</Label><PhoneInput aria-invalid={!!errors.phone} error={!!errors.phone} value={form.phone ?? ''} onChange={(value) => set('phone', value)} /><FieldError message={errors.phone} /></div>
              <div>
                <Label>Staff type</Label>
                <Select value={form.staffType} onValueChange={(v) => set('staffType', v)}>
                  {STAFF_TYPES.map(t => <SelectItem key={t} value={t}>{toTitleCase(t)}</SelectItem>)}
                </Select>
              </div>
              <div>
                <Label>Shift</Label>
                <Select value={form.shift || ''} onValueChange={(v) => set('shift', v)} placeholder="Select shift">
                  <SelectItem value="MORNING">Morning</SelectItem>
                  <SelectItem value="EVENING">Evening</SelectItem>
                  <SelectItem value="NIGHT">Night</SelectItem>
                </Select>
              </div>
              <div><Label>Joining date</Label><Input type="date" value={form.joiningDate || ''} onChange={(e) => set('joiningDate', e.target.value)} /></div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} loading={saving}>Onboard</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
