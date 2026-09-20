import { useEffect, useState } from 'react'
import { Plus, Stethoscope, CalendarDays, UserX } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { SearchInput } from '@/components/common/SearchInput'
import { Pagination } from '@/components/common/Pagination'
import { Card } from '@/components/ui/Card'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select, SelectItem } from '@/components/ui/Select'
import { usePaginated } from '@/hooks/usePaginated'
import { useDebounce } from '@/hooks/useDebounce'
import { doctorsApi } from '@/lib/services/doctors'
import { departmentsApi } from '@/lib/services/departments'
import type { Department, Doctor } from '@/types/domain'
import { formatCurrency } from '@/lib/utils'
import { apiErrorMessage } from '@/lib/api-client'
import { toast } from 'sonner'
import { DoctorAvailabilityDialog } from './DoctorAvailabilityDialog'
import { useAuth } from '@/features/auth/AuthContext'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'

const EMPTY_FORM = {
  username: '', email: '', password: '', fullName: '', phone: '',
  departmentId: '', specialization: '', licenseNumber: '', qualifications: '',
  experienceYears: '0', consultationFee: '0', maxPatientsPerDay: '20', officeRoomNumber: '',
}

export default function DoctorsPage() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query)
  const [createOpen, setCreateOpen] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [availabilityDoctor, setAvailabilityDoctor] = useState<Doctor | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<Doctor | null>(null)
  const [deactivating, setDeactivating] = useState(false)

  const { session } = useAuth()
  const isAdmin = session?.role === 'HOSPITAL_ADMIN'
  // Backend allows availability-status/availability management for ADMIN + DOCTOR only.
  const canManageAvailability = session?.role === 'HOSPITAL_ADMIN' || session?.role === 'DOCTOR'

  const { data, loading, page, setPage, reload } = usePaginated(
    (page, size) => doctorsApi.list({ q: debouncedQuery || undefined, page, size }),
    [debouncedQuery],
  )

  useEffect(() => {
    if (createOpen && departments.length === 0) {
      departmentsApi.list({ size: 100 }).then(r => setDepartments(r.content)).catch(() => {})
    }
  }, [createOpen, departments.length])

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleCreate() {
    if (!form.username || !form.password || !form.fullName || !form.departmentId || !form.specialization || !form.licenseNumber) {
      toast.error('Please fill in all required fields'); return
    }
    setSaving(true)
    try {
      await doctorsApi.create({
        username: form.username, email: form.email || undefined, password: form.password,
        fullName: form.fullName, phone: form.phone || undefined,
        departmentId: Number(form.departmentId), specialization: form.specialization,
        licenseNumber: form.licenseNumber, qualifications: form.qualifications || undefined,
        experienceYears: Number(form.experienceYears), consultationFee: Number(form.consultationFee),
        maxPatientsPerDay: Number(form.maxPatientsPerDay), officeRoomNumber: form.officeRoomNumber || undefined,
      })
      toast.success('Doctor onboarded')
      setCreateOpen(false)
      setForm(EMPTY_FORM)
      reload()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate() {
    if (!deactivateTarget) return
    setDeactivating(true)
    try {
      await doctorsApi.deactivate(deactivateTarget.id)
      toast.success('Doctor deactivated')
      setDeactivateTarget(null)
      reload()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setDeactivating(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Doctors"
        description="Onboard doctors and manage their clinical profiles."
        actions={isAdmin ? <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Onboard doctor</Button> : undefined}
      />

      <Card>
        <div className="p-4 border-b border-border">
          <SearchInput value={query} onChange={setQuery} placeholder="Search by specialization or doctor code..." className="max-w-sm" />
        </div>

        {loading ? <PageSpinner /> : !data || data.content.length === 0 ? (
          <EmptyState icon={<Stethoscope className="h-10 w-10" />} title="No doctors yet"
            description="Onboard your first doctor - this creates their login and clinical profile together."
            action={isAdmin ? <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Onboard doctor</Button> : undefined}
          />
        ) : (
          <>
            <Table>
              <THead>
                <TR><TH>Code</TH><TH>Name</TH><TH>Department</TH><TH>Specialization</TH><TH>Fee</TH><TH>Experience</TH><TH>Status</TH><TH></TH></TR>
              </THead>
              <TBody>
                {data.content.map(d => (
                  <TR key={d.id}>
                    <TD className="font-mono text-xs">{d.doctorCode}</TD>
                    <TD className="font-medium text-ink-900">{d.fullName}</TD>
                    <TD>{d.departmentName}</TD>
                    <TD>{d.specialization}</TD>
                    <TD>{formatCurrency(d.consultationFee)}</TD>
                    <TD>{d.experienceYears} yrs</TD>
                    <TD><StatusBadge status={d.availabilityStatus} /> {!d.active && <Badge variant="danger">Inactive</Badge>}</TD>
                    <TD className="text-right">
                      <div className="flex justify-end gap-2">
                        {canManageAvailability && (
                          <Button size="sm" variant="outline" onClick={() => setAvailabilityDoctor(d)}>
                            <CalendarDays className="h-3.5 w-3.5" /> Availability
                          </Button>
                        )}
                        {isAdmin && d.active && (
                          <Button size="sm" variant="danger" onClick={() => setDeactivateTarget(d)}>
                            <UserX className="h-3.5 w-3.5" /> Deactivate
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

      {isAdmin && (
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent title="Onboard a new doctor" description="Creates the doctor's login and clinical profile together." className="max-w-2xl">
            <div className="space-y-5">
              <section>
                <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">Login</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Username *</Label><Input value={form.username} onChange={(e) => set('username', e.target.value)} /></div>
                  <div><Label>Password *</Label><Input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} /></div>
                  <div><Label>Full name *</Label><Input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} /></div>
                  <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
                  <div className="col-span-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
                </div>
              </section>
              <section>
                <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">Clinical profile</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Department *</Label>
                    <Select value={form.departmentId} onValueChange={(v) => set('departmentId', v)} placeholder="Select department">
                      {departments.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                    </Select>
                  </div>
                  <div><Label>Specialization *</Label><Input value={form.specialization} onChange={(e) => set('specialization', e.target.value)} placeholder="e.g. Interventional Cardiology" /></div>
                  <div><Label>License number *</Label><Input value={form.licenseNumber} onChange={(e) => set('licenseNumber', e.target.value)} /></div>
                  <div><Label>Qualifications</Label><Input value={form.qualifications} onChange={(e) => set('qualifications', e.target.value)} placeholder="MBBS, MD" /></div>
                  <div><Label>Experience (years)</Label><Input type="number" min={0} value={form.experienceYears} onChange={(e) => set('experienceYears', e.target.value)} /></div>
                  <div><Label>Consultation fee (₹)</Label><Input type="number" min={0} value={form.consultationFee} onChange={(e) => set('consultationFee', e.target.value)} /></div>
                  <div><Label>Max patients / day</Label><Input type="number" min={1} value={form.maxPatientsPerDay} onChange={(e) => set('maxPatientsPerDay', e.target.value)} /></div>
                  <div><Label>Office room</Label><Input value={form.officeRoomNumber} onChange={(e) => set('officeRoomNumber', e.target.value)} /></div>
                </div>
              </section>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} loading={saving}>Onboard doctor</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <DoctorAvailabilityDialog
        open={!!availabilityDoctor}
        onOpenChange={(o) => !o && setAvailabilityDoctor(null)}
        doctor={availabilityDoctor}
      />

      <ConfirmDialog
        open={!!deactivateTarget}
        onOpenChange={(o) => !o && setDeactivateTarget(null)}
        title={`Deactivate Dr. ${deactivateTarget?.fullName ?? ''}?`}
        description="They'll be hidden from search and new bookings, but all their existing appointments, consultations and records stay intact."
        confirmLabel="Deactivate"
        destructive
        onConfirm={handleDeactivate}
        loading={deactivating}
      />
    </div>
  )
}