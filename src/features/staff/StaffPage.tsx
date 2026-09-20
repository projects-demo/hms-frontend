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

const STAFF_TYPES = ['NURSE', 'RECEPTIONIST', 'BILLING_STAFF', 'PHARMACIST', 'LAB_TECH']
const EMPTY: StaffRequest = { username: '', password: '', fullName: '', phone: '', staffType: 'NURSE', shift: '' }

export default function StaffPage() {
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState<StaffRequest>(EMPTY)
  const [saving, setSaving] = useState(false)

  const { data, loading, page, setPage, reload } = usePaginated(
    (page, size) => staffApi.list({ staffType: typeFilter === 'ALL' ? undefined : typeFilter, page, size }),
    [typeFilter],
  )

  function set<K extends keyof StaffRequest>(key: K, value: StaffRequest[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleCreate() {
    if (!form.username || !form.password || !form.fullName) { toast.error('Username, password and full name are required'); return }
    setSaving(true)
    try {
      await staffApi.create(form)
      toast.success('Staff member onboarded')
      setCreateOpen(false)
      setForm(EMPTY)
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
              <div><Label>Username *</Label><Input value={form.username} onChange={(e) => set('username', e.target.value)} /></div>
              <div><Label>Password *</Label><Input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} /></div>
              <div className="col-span-2"><Label>Full name *</Label><Input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
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
