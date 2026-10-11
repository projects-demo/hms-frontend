import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Download, Plus, Pencil, ToggleLeft, ToggleRight, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select, SelectItem } from '@/components/ui/Select'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { Pagination } from '@/components/common/Pagination'
import { PageSpinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { usePaginated } from '@/hooks/usePaginated'
import { useDebounce } from '@/hooks/useDebounce'
import { billingApi } from '@/lib/services/billing'
import { doctorsApi } from '@/lib/services/doctors'
import type { ChargeMaster, ChargeMasterSummary, ChargeType, Doctor } from '@/types/domain'
import { formatCurrency } from '@/lib/utils'
import { apiErrorMessage } from '@/lib/api-client'
import { toast } from 'sonner'

type ChargeForm = { name: string; code: string; chargeTypeId: string; defaultPrice: string; applicableDoctorId: string }
const EMPTY_CHARGE: ChargeForm = { name: '', code: '', chargeTypeId: '', defaultPrice: '', applicableDoctorId: '' }

export default function ChargeMasterPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query)
  const [chargeTypeFilter, setChargeTypeFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [types, setTypes] = useState<ChargeType[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [summary, setSummary] = useState<ChargeMasterSummary | null>(null)
  const [chargeDialogOpen, setChargeDialogOpen] = useState(false)
  const [typeDialogOpen, setTypeDialogOpen] = useState(false)
  const [editingCharge, setEditingCharge] = useState<ChargeMaster | null>(null)
  const [chargeForm, setChargeForm] = useState<ChargeForm>(EMPTY_CHARGE)
  const [typeForm, setTypeForm] = useState({ name: '', code: '', active: true })
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const activeFilter = statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE'
  const { data, loading, page, setPage, reload } = usePaginated(
    (currentPage, size) => billingApi.chargeMaster.search({
      q: debouncedQuery || undefined,
      chargeTypeId: chargeTypeFilter === 'ALL' ? undefined : Number(chargeTypeFilter),
      active: activeFilter,
      includeInactive: true,
      page: currentPage,
      size,
    }),
    [debouncedQuery, chargeTypeFilter, statusFilter],
    10,
  )

  useEffect(() => {
    Promise.all([
      billingApi.chargeTypes.list(),
      doctorsApi.list({ size: 100 }),
      billingApi.chargeMaster.summary(),
    ]).then(([chargeTypes, doctorPage, chargeSummary]) => {
      setTypes(chargeTypes)
      setDoctors(doctorPage.content)
      setSummary(chargeSummary)
    }).catch(err => toast.error(apiErrorMessage(err)))
  }, [])

  const doctorNames = useMemo(() => new Map(doctors.map(doctor => [doctor.id, doctor.fullName])), [doctors])

  function openNewCharge() {
    setEditingCharge(null)
    setChargeForm({ ...EMPTY_CHARGE, chargeTypeId: String(types.find(type => type.active)?.id ?? '') })
    setChargeDialogOpen(true)
  }

  function openEditCharge(charge: ChargeMaster) {
    setEditingCharge(charge)
    setChargeForm({
      name: charge.name,
      code: charge.code,
      chargeTypeId: String(charge.chargeTypeId),
      defaultPrice: String(charge.defaultPrice),
      applicableDoctorId: charge.applicableDoctorId == null ? '' : String(charge.applicableDoctorId),
    })
    setChargeDialogOpen(true)
  }

  async function saveCharge() {
    const price = Number(chargeForm.defaultPrice)
    if (!chargeForm.name.trim() || !chargeForm.chargeTypeId || !Number.isFinite(price) || price < 0) {
      toast.error('Charge name, charge type, and a valid default amount are required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: chargeForm.name.trim(),
        code: chargeForm.code.trim() || undefined,
        chargeTypeId: Number(chargeForm.chargeTypeId),
        defaultPrice: price,
        applicableDoctorId: chargeForm.applicableDoctorId ? Number(chargeForm.applicableDoctorId) : undefined,
      }
      if (editingCharge) await billingApi.chargeMaster.update(editingCharge.id, payload)
      else await billingApi.chargeMaster.create(payload)
      toast.success(editingCharge ? 'Charge updated' : 'Charge added')
      setChargeDialogOpen(false)
      setChargeForm(EMPTY_CHARGE)
      setEditingCharge(null)
      reload()
      setSummary(await billingApi.chargeMaster.summary())
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function saveChargeType() {
    if (!typeForm.name.trim()) {
      toast.error('Charge type name is required')
      return
    }
    setSaving(true)
    try {
      const type = await billingApi.chargeTypes.create({
        name: typeForm.name.trim(),
        code: typeForm.code.trim() || undefined,
        active: typeForm.active,
      })
      setTypes(current => [...current, type].sort((a, b) => a.name.localeCompare(b.name)))
      setSummary(await billingApi.chargeMaster.summary())
      toast.success('Charge type added')
      setTypeDialogOpen(false)
      setTypeForm({ name: '', code: '', active: true })
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(charge: ChargeMaster) {
    setUpdatingId(charge.id)
    try {
      await billingApi.chargeMaster.setActive(charge.id, !charge.active)
      toast.success(charge.active ? 'Charge deactivated' : 'Charge activated')
      reload()
      setSummary(await billingApi.chargeMaster.summary())
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setUpdatingId(null)
    }
  }

  async function exportCsv() {
    setExporting(true)
    try {
      const records: ChargeMaster[] = []
      let currentPage = 0
      let totalPages = 1
      while (currentPage < totalPages) {
        const result = await billingApi.chargeMaster.search({
          q: debouncedQuery || undefined,
          chargeTypeId: chargeTypeFilter === 'ALL' ? undefined : Number(chargeTypeFilter),
          active: activeFilter,
          includeInactive: true,
          page: currentPage,
          size: 100,
        })
        records.push(...result.content)
        totalPages = result.totalPages
        currentPage += 1
      }
      const cell = (value: unknown) => {
        const text = String(value ?? '')
        const safe = /^[=+\-@]/.test(text) ? `'${text}` : text
        return `"${safe.replace(/"/g, '""')}"`
      }
      const rows = [
        ['Code', 'Charge Name', 'Type', 'Amount', 'Doctor', 'Status'],
        ...records.map(charge => [charge.code, charge.name, charge.chargeTypeName, charge.defaultPrice,
          charge.applicableDoctorId == null ? 'All Doctors' : doctorNames.get(charge.applicableDoctorId) ?? '',
          charge.active ? 'Active' : 'Inactive']),
      ]
      const csv = rows.map(row => row.map(cell).join(',')).join('\r\n')
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
      const link = document.createElement('a')
      link.href = url
      link.download = 'charge-master.csv'
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex min-w-0 items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/billing')}><ArrowLeft className="h-4 w-4" /> Back to Billing</Button>
          <div className="h-10 border-l border-border" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Charge Master Management</h1>
            <p className="mt-0.5 text-sm text-ink-500">Configure and manage billable items</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportCsv} loading={exporting}><Download className="h-4 w-4" /> Export</Button>
          <Button variant="outline" onClick={() => { setTypeForm({ name: '', code: '', active: true }); setTypeDialogOpen(true) }}><Plus className="h-4 w-4" /> Add Charge Type</Button>
          <Button onClick={openNewCharge}><Plus className="h-4 w-4" /> Add Charge</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4"><p className="text-sm text-ink-500">Total Charges</p><p className="mt-1 text-2xl font-semibold tabular-nums">{summary?.totalCharges ?? '—'}</p></Card>
        <Card className="p-4"><p className="text-sm text-ink-500">Active Charges</p><p className="mt-1 text-2xl font-semibold tabular-nums text-success-600">{summary?.activeCharges ?? '—'}</p></Card>
        <Card className="p-4"><p className="text-sm text-ink-500">Inactive Charges</p><p className="mt-1 text-2xl font-semibold tabular-nums text-ink-400">{summary?.inactiveCharges ?? '—'}</p></Card>
        <Card className="p-4"><p className="text-sm text-ink-500">Charge Types</p><p className="mt-1 text-2xl font-semibold tabular-nums text-accent-600">{summary?.chargeTypes ?? '—'}</p></Card>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div><Label>Search</Label><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" /><Input className="pl-9" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by name or code..." /></div></div>
          <div><Label>Charge Type</Label><Select value={chargeTypeFilter} onValueChange={setChargeTypeFilter}><SelectItem value="ALL">All Types</SelectItem>{types.map(type => <SelectItem key={type.id} value={String(type.id)}>{type.name}</SelectItem>)}</Select></div>
          <div><Label>Status</Label><Select value={statusFilter} onValueChange={setStatusFilter}><SelectItem value="ALL">All Status</SelectItem><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="INACTIVE">Inactive</SelectItem></Select></div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? <PageSpinner /> : !data || data.content.length === 0 ? (
          <EmptyState title="No charges found" description="Adjust the filters or add a charge to the master list." action={<Button onClick={openNewCharge}><Plus className="h-4 w-4" /> Add Charge</Button>} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <THead><TR><TH>Code</TH><TH>Charge Name</TH><TH>Type</TH><TH>Amount</TH><TH>Doctor</TH><TH>Status</TH><TH className="text-right">Actions</TH></TR></THead>
                <TBody>
                  {data.content.map(charge => (
                    <TR key={charge.id}>
                      <TD className="font-mono text-xs font-medium">{charge.code}</TD>
                      <TD className="font-medium text-ink-900">{charge.name}</TD>
                      <TD><Badge variant="primary">{charge.chargeTypeName}</Badge></TD>
                      <TD className="font-medium">{formatCurrency(charge.defaultPrice)}</TD>
                      <TD>{charge.applicableDoctorId == null ? 'All Doctors' : doctorNames.get(charge.applicableDoctorId) ?? 'Doctor'}</TD>
                      <TD><StatusBadge status={charge.active ? 'ACTIVE' : 'INACTIVE'} /></TD>
                      <TD><div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" aria-label={`Edit ${charge.name}`} title="Edit charge" onClick={() => openEditCharge(charge)}><Pencil className="h-4 w-4 text-primary-600" /></Button>
                        <Button size="icon" variant="ghost" aria-label={charge.active ? `Deactivate ${charge.name}` : `Activate ${charge.name}`} title={charge.active ? 'Deactivate charge' : 'Activate charge'} loading={updatingId === charge.id} onClick={() => toggleActive(charge)}>
                          {charge.active ? <ToggleRight className="h-5 w-5 text-accent-600" /> : <ToggleLeft className="h-5 w-5 text-ink-400" />}
                        </Button>
                      </div></TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
            <Pagination page={page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
          </>
        )}
      </Card>

      <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
        <DialogContent title="Add New Charge Type" className="max-w-xl">
          <div className="space-y-4">
            <div><Label>Charge Type Name *</Label><Input value={typeForm.name} onChange={event => setTypeForm(current => ({ ...current, name: event.target.value }))} placeholder="e.g., Pathology Test, Radiology Scan" /></div>
            <div><Label>Charge Type Code <span className="text-ink-400">(Auto-generates if empty)</span></Label><Input value={typeForm.code} onChange={event => setTypeForm(current => ({ ...current, code: event.target.value }))} placeholder="PATHOLOGY_TEST" /><p className="mt-1 text-xs text-ink-400">Leave blank to generate a code from the name.</p></div>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-success-200 bg-success-50/40 p-3 text-sm"><input type="checkbox" checked={typeForm.active} onChange={event => setTypeForm(current => ({ ...current, active: event.target.checked }))} /> Active</label>
            <div className="flex justify-end gap-2 border-t border-border pt-4"><Button variant="outline" onClick={() => setTypeDialogOpen(false)}>Cancel</Button><Button onClick={saveChargeType} loading={saving} disabled={!typeForm.name.trim()}>Add Charge Type</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={chargeDialogOpen} onOpenChange={setChargeDialogOpen}>
        <DialogContent title={editingCharge ? 'Edit Charge' : 'Add New Charge'} className="max-w-xl">
          <div className="space-y-4">
            <div><Label>Charge Name *</Label><Input value={chargeForm.name} onChange={event => setChargeForm(current => ({ ...current, name: event.target.value }))} placeholder="Enter charge name" /></div>
            <div><Label>Code (Optional)</Label><Input value={chargeForm.code} onChange={event => setChargeForm(current => ({ ...current, code: event.target.value }))} placeholder="Leave blank to auto-generate" /></div>
            <div><Label>Charge Type *</Label><Select value={chargeForm.chargeTypeId} onValueChange={value => setChargeForm(current => ({ ...current, chargeTypeId: value }))} placeholder="Select charge type">{types.filter(type => type.active || (editingCharge && type.id === editingCharge.chargeTypeId)).map(type => <SelectItem key={type.id} value={String(type.id)}>{type.name}</SelectItem>)}</Select></div>
            <div><Label>Default Amount (₹) *</Label><Input type="number" min={0} step="0.01" value={chargeForm.defaultPrice} onChange={event => setChargeForm(current => ({ ...current, defaultPrice: event.target.value }))} placeholder="Enter amount" /></div>
            <div><Label>Applicable Doctor</Label><Select value={chargeForm.applicableDoctorId} onValueChange={value => setChargeForm(current => ({ ...current, applicableDoctorId: value }))}><SelectItem value="ALL">All Doctors</SelectItem>{doctors.map(doctor => <SelectItem key={doctor.id} value={String(doctor.id)}>{doctor.fullName}</SelectItem>)}</Select></div>
            <div className="flex justify-end gap-2 border-t border-border pt-4"><Button variant="outline" onClick={() => setChargeDialogOpen(false)}>Cancel</Button><Button onClick={saveCharge} loading={saving} disabled={!chargeForm.name.trim() || !chargeForm.chargeTypeId}>{editingCharge ? 'Save Changes' : 'Add Charge'}</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}