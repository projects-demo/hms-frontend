import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select, SelectItem } from '@/components/ui/Select'
import { AsyncCombobox } from '@/components/common/AsyncCombobox'
import { patientsApi } from '@/lib/services/patients'
import { appointmentsApi } from '@/lib/services/appointments'
import { billingApi } from '@/lib/services/billing'
import type { OptionDto, PageResponse } from '@/types/api'
import { apiErrorMessage } from '@/lib/api-client'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import type { Appointment, Bill, ChargeMaster, ChargeType, Patient, PaymentReceipt } from '@/types/domain'
import { FieldError } from '@/components/common/FieldError'
import { Pagination } from '@/components/common/Pagination'

interface LineItem { chargeTypeId?: string; chargeMasterId?: number; isCustom?: boolean; description: string; quantity: string; unitPrice: string }
const EMPTY_ITEM: LineItem = { description: '', quantity: '1', unitPrice: '0' }

export function CreateBillDialog({ open, onOpenChange, defaultPatient, defaultAppointment, bill, onSaved }: {
  open: boolean; onOpenChange: (o: boolean) => void; defaultPatient?: OptionDto | null
  defaultAppointment?: Appointment | null
  bill?: Bill | null
  onSaved?: (bill: Bill) => void
}) {
  const navigate = useNavigate()
  const [patient, setPatient] = useState<OptionDto | null>(defaultPatient ?? null)
  const [billType, setBillType] = useState('OPD')
  const [items, setItems] = useState<LineItem[]>([{ ...EMPTY_ITEM }])
  const [standardItems, setStandardItems] = useState<ChargeMaster[]>([])
  const [chargeTypes, setChargeTypes] = useState<ChargeType[]>([])
  const [saving, setSaving] = useState(false)
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({})
  const [linkedAppointment, setLinkedAppointment] = useState<Appointment | null>(defaultAppointment ?? null)
  const [patientSearchMode, setPatientSearchMode] = useState<'patient' | 'appointment'>('patient')
  const [appointmentCode, setAppointmentCode] = useState('')
  const [searchingAppointment, setSearchingAppointment] = useState(false)
  const [appointmentSearchError, setAppointmentSearchError] = useState('')
  const [patientRecord, setPatientRecord] = useState<Patient | null>(null)
  const [latestOpdId, setLatestOpdId] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyPage, setHistoryPage] = useState(0)
  const [history, setHistory] = useState<PageResponse<PaymentReceipt> | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setPatient(defaultPatient ?? null)
    setLinkedAppointment(defaultAppointment ?? null)
    setAppointmentCode('')
    setAppointmentSearchError('')
    Promise.all([billingApi.chargeTypes.list(), billingApi.chargeMaster.search({ size: 100 })])
      .then(([types, result]) => {
        setChargeTypes(types.filter(type => type.active))
        setStandardItems(result.content.filter(item => item.active))
        if (bill) {
          const typeByChargeId = new Map(result.content.map(item => [item.id, item.chargeTypeId]))
          setItems(bill.items.map(item => ({
            chargeTypeId: item.chargeMasterId == null ? undefined : String(typeByChargeId.get(item.chargeMasterId) ?? ''),
            chargeMasterId: item.chargeMasterId ?? undefined,
            isCustom: item.chargeMasterId == null,
            description: item.description,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
          })))
        }
      })
      .catch(err => toast.error(apiErrorMessage(err)))
    if (bill) {
      setBillType(bill.billType)
      patientsApi.get(bill.patientId).then(patientRecord => setPatient({
        id: patientRecord.id,
        label: `${patientRecord.firstName} ${patientRecord.lastName}`,
        subLabel: patientRecord.patientCode,
      })).catch(err => toast.error(apiErrorMessage(err)))
    } else {
      setBillType('OPD')
      setItems(defaultAppointment ? [{
      isCustom: true,
      description: `OPD consultation — ${defaultAppointment.appointmentCode}`,
      quantity: '1',
      unitPrice: String(defaultAppointment.feeAmount),
      }] : [{ ...EMPTY_ITEM }])
    }
    setItemErrors({})
  }, [open, defaultPatient, defaultAppointment, bill])

  useEffect(() => {
    if (!patient) {
      setPatientRecord(null)
      setLatestOpdId(null)
      setHistory(null)
      setHistoryOpen(false)
      return
    }
    setPatientRecord(null)
    setLatestOpdId(null)
    let active = true
    patientsApi.get(patient.id).then(record => { if (active) setPatientRecord(record) })
      .catch(err => { if (active) toast.error(apiErrorMessage(err)) })
    if (linkedAppointment) {
      setLatestOpdId(linkedAppointment.appointmentCode)
    } else {
      appointmentsApi.search({ patientId: patient.id, page: 0, size: 1 })
        .then(result => { if (active) setLatestOpdId(result.content[0]?.appointmentCode ?? null) })
        .catch(() => { if (active) setLatestOpdId(null) })
    }
    return () => { active = false }
  }, [patient?.id, linkedAppointment?.id])

  useEffect(() => {
    if (!patient || !historyOpen) return
    let active = true
    setHistoryLoading(true)
    billingApi.bills.patientReceiptHistory(patient.id, { page: historyPage, size: 5 })
      .then(result => { if (active) setHistory(result) })
      .catch(err => { if (active) toast.error(apiErrorMessage(err)) })
      .finally(() => { if (active) setHistoryLoading(false) })
    return () => { active = false }
  }, [patient?.id, historyOpen, historyPage])

  async function searchAppointment() {
    const code = appointmentCode.trim().toUpperCase()
    if (!/^APT-[A-Z0-9-]+$/.test(code)) {
      setAppointmentSearchError('Enter an appointment ID beginning with APT- (for example, APT-000123).')
      return
    }
    setSearchingAppointment(true)
    setAppointmentSearchError('')
    try {
      const appointment = await appointmentsApi.getByCode(code)
      if (appointment.status === 'CANCELLED' || appointment.status === 'NO_SHOW') {
        setAppointmentSearchError('A cancelled or no-show appointment cannot be billed.')
        return
      }
      const patientRecord = await patientsApi.get(appointment.patientId)
      setPatient({
        id: patientRecord.id,
        label: `${patientRecord.firstName} ${patientRecord.lastName}`,
        subLabel: patientRecord.patientCode,
      })
      setLinkedAppointment(appointment)
      setHistoryPage(0)
      setBillType('OPD')
      setItems([{
        isCustom: true,
        description: `OPD consultation — ${appointment.appointmentCode}`,
        quantity: '1',
        unitPrice: String(appointment.feeAmount),
      }])
      setItemErrors({})
    } catch (err) {
      setAppointmentSearchError(apiErrorMessage(err))
    } finally {
      setSearchingAppointment(false)
    }
  }

  const total = items.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0)

  function updateItem(idx: number, patch: Partial<LineItem>) {
    setItems(list => list.map((it, i) => i === idx ? { ...it, ...patch } : it))
    setItemErrors(current => {
      const next = { ...current }
      delete next[`${idx}-description`]
      delete next[`${idx}-quantity`]
      delete next[`${idx}-unitPrice`]
      return next
    })
  }

  function selectStandardItem(idx: number, value: string) {
    if (value === 'custom') {
      updateItem(idx, { chargeMasterId: undefined, isCustom: true, description: '', unitPrice: '0' })
      return
    }
    const standard = standardItems.find(item => String(item.id) === value)
    if (standard) {
      updateItem(idx, { chargeTypeId: String(standard.chargeTypeId), chargeMasterId: standard.id, isCustom: false, description: standard.name, unitPrice: String(standard.defaultPrice) })
    }
  }

  function selectChargeType(idx: number, chargeTypeId: string) {
    updateItem(idx, { chargeTypeId, chargeMasterId: undefined, isCustom: false, description: '', unitPrice: '0' })
  }

  async function handleSubmit() {
    if (!patient) { toast.error('Select a patient'); return }
    const errors: Record<string, string> = {}
    const selectedItems = items.filter(item => item.chargeMasterId || item.isCustom)
    selectedItems.forEach((item) => {
      const idx = items.indexOf(item)
      const quantity = Number(item.quantity)
      const unitPrice = Number(item.unitPrice)
      if (item.isCustom && !item.description.trim()) errors[`${idx}-description`] = 'Description is required.'
      if (!Number.isInteger(quantity) || quantity < 1) errors[`${idx}-quantity`] = 'Quantity must be a whole number of at least 1.'
      if (!Number.isFinite(unitPrice) || unitPrice < 0) errors[`${idx}-unitPrice`] = 'Price must be a non-negative amount.'
    })
    setItemErrors(errors)
    if (selectedItems.length === 0) { toast.error('Add at least one line item'); return }
    if (Object.values(errors).some(Boolean)) { toast.error('Please correct the highlighted line items'); return }
    const validItems = selectedItems
    setSaving(true)
    try {
      const payload = {
        patientId: patient.id,
        admissionId: bill?.admissionId ?? undefined,
        appointmentId: bill?.appointmentId ?? linkedAppointment?.id,
        billType,
        items: validItems.map(i => ({ chargeMasterId: i.chargeMasterId, description: i.description, quantity: Number(i.quantity) || 1, unitPrice: Number(i.unitPrice) })),
      }
      const savedBill = bill
        ? await billingApi.bills.updateDraft(bill.id, payload)
        : await billingApi.bills.create(payload)
      toast.success(bill ? 'Draft bill updated' : 'Bill created as draft')
      onOpenChange(false)
      setItems([{ ...EMPTY_ITEM }])
      setItemErrors({})
      setPatient(null)
      if (bill) onSaved?.(savedBill)
      else navigate(`/billing/${savedBill.id}`)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={bill ? 'Edit draft bill' : 'Create bill'} description={bill ? 'Changes are allowed only until the bill is submitted.' : undefined} className="max-w-xl">
        <div className="space-y-4">
          <div>
            <Label>Patient *</Label>
            {(defaultAppointment || linkedAppointment) && !bill ? (
              <div className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink-700">
                {patient?.label ?? `Patient #${(linkedAppointment ?? defaultAppointment)!.patientId}`}
                {patient?.subLabel && <span className="ml-2 text-xs text-ink-400">{patient.subLabel}</span>}
                {linkedAppointment && !defaultAppointment && (
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="text-xs text-ink-500">Linked to {linkedAppointment.appointmentCode}</span>
                    <Button type="button" size="sm" variant="ghost" onClick={() => { setLinkedAppointment(null); setPatient(null); setAppointmentCode('') }}>Change</Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="mb-2 flex gap-2">
                  <Button type="button" size="sm" variant={patientSearchMode === 'patient' ? 'primary' : 'outline'} onClick={() => setPatientSearchMode('patient')}>Patient search</Button>
                  <Button type="button" size="sm" variant={patientSearchMode === 'appointment' ? 'primary' : 'outline'} onClick={() => setPatientSearchMode('appointment')}>Appointment ID</Button>
                </div>
                {patientSearchMode === 'patient' ? (
                  <AsyncCombobox value={patient} onChange={(value) => { setPatient(value); setLinkedAppointment(null); setHistoryPage(0) }} fetchOptions={(q) => patientsApi.autocomplete(q)} placeholder="Search patient" />
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <Input
                        value={appointmentCode}
                        onChange={(event) => { setAppointmentCode(event.target.value.toUpperCase()); setAppointmentSearchError('') }}
                        placeholder="APT-000123"
                        maxLength={30}
                        onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void searchAppointment() } }}
                      />
                      <Button type="button" variant="outline" onClick={() => void searchAppointment()} loading={searchingAppointment}>Search</Button>
                    </div>
                    <FieldError message={appointmentSearchError} />
                    {linkedAppointment && !bill && (
                      <p className="text-xs text-success-600">Linked to {linkedAppointment.appointmentCode} · {linkedAppointment.doctorName || 'Doctor'} · {linkedAppointment.appointmentDate}</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          {patient && patientRecord && (
            <section className="rounded-lg border border-border bg-canvas/60 p-3">
              <button
                type="button"
                className="grid w-full grid-cols-2 gap-x-4 gap-y-2 text-left text-sm sm:grid-cols-4"
                aria-expanded={historyOpen}
                onClick={() => { setHistoryOpen(value => !value); setHistoryPage(0) }}
              >
                <span><span className="block text-xs text-ink-500">Patient ID</span><strong>{patientRecord.id}</strong></span>
                <span><span className="block text-xs text-ink-500">Patient code</span><strong>{patientRecord.patientCode}</strong></span>
                <span><span className="block text-xs text-ink-500">Mobile</span><strong>{patientRecord.primaryPhone}</strong></span>
                <span><span className="block text-xs text-ink-500">OPD ID</span><strong>{latestOpdId ?? '—'}</strong></span>
                <span className="col-span-2 text-xs font-medium text-primary-700 sm:col-span-4">
                  {historyOpen ? 'Hide payment history' : 'Click to view payment history'}
                </span>
              </button>
              {historyOpen && (
                <div className="mt-3 border-t border-border pt-3">
                  <h3 className="mb-2 text-sm font-semibold">Past payments</h3>
                  {historyLoading ? <p className="text-xs text-ink-500">Loading payment history…</p>
                    : !history || history.content.length === 0 ? <p className="text-xs text-ink-500">No previous payments for this patient.</p>
                    : <>
                      <div className="space-y-2">
                        {history.content.map(receipt => (
                          <div key={receipt.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-white px-2.5 py-2 text-xs">
                            <span><strong>{receipt.receiptNumber}</strong><span className="ml-2 text-ink-500">{receipt.billNumber}</span></span>
                            <span className="text-ink-500">{formatDateTime(receipt.receivedAt)}</span>
                            <span>{receipt.paymentMode}</span>
                            <strong>{formatCurrency(receipt.amount)}</strong>
                          </div>
                        ))}
                      </div>
                      <Pagination page={history.page ?? historyPage} totalPages={history.totalPages} totalElements={history.totalElements} onPageChange={setHistoryPage} />
                    </>}
                </div>
              )}
            </section>
          )}
          <div>
            <Label>Bill type</Label>
            <Select value={billType} onValueChange={setBillType} className="w-40">
              <SelectItem value="OPD">OPD</SelectItem>
              <SelectItem value="IPD">IPD</SelectItem>
              <SelectItem value="PHARMACY">Pharmacy</SelectItem>
            </Select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="mb-0">Line items</Label>
              <Button size="sm" variant="outline" onClick={() => setItems(l => [...l, { ...EMPTY_ITEM }])}>
                <Plus className="h-3.5 w-3.5" /> Add item
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-1.5">
                  <div className="col-span-3">
                    <Select value={item.chargeTypeId ?? ''} onValueChange={value => selectChargeType(idx, value)} placeholder="Charge type">
                      {chargeTypes.map(type => <SelectItem key={type.id} value={String(type.id)}>{type.name}</SelectItem>)}
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <Select value={item.chargeMasterId ? String(item.chargeMasterId) : item.isCustom ? 'custom' : ''} onValueChange={(value) => selectStandardItem(idx, value)} placeholder="Select item" disabled={!item.chargeTypeId}>
                      {item.chargeTypeId && !defaultAppointment && !linkedAppointment && <SelectItem value="custom">Custom item</SelectItem>}
                      {standardItems.filter(standard => String(standard.chargeTypeId) === item.chargeTypeId).map(standard => (
                        <SelectItem key={standard.id} value={String(standard.id)}>{standard.name} — {formatCurrency(standard.defaultPrice)}</SelectItem>
                      ))}
                    </Select>
                    {item.isCustom && (
                      <>
                        <Input className="mt-1" maxLength={255} aria-invalid={!!itemErrors[`${idx}-description`]} error={!!itemErrors[`${idx}-description`]} placeholder="Description" value={item.description} onChange={(e) => updateItem(idx, { description: e.target.value })} />
                        <FieldError message={itemErrors[`${idx}-description`]} />
                      </>
                    )}
                  </div>
                  <div className="col-span-2"><Input type="number" min={1} step={1} aria-invalid={!!itemErrors[`${idx}-quantity`]} error={!!itemErrors[`${idx}-quantity`]} placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(idx, { quantity: e.target.value })} /><FieldError message={itemErrors[`${idx}-quantity`]} /></div>
                  <div className="col-span-3"><Input type="number" min={0} step="0.01" aria-invalid={!!itemErrors[`${idx}-unitPrice`]} error={!!itemErrors[`${idx}-unitPrice`]} placeholder="Unit price" value={item.unitPrice} disabled={!!item.chargeMasterId} onChange={(e) => updateItem(idx, { unitPrice: e.target.value })} /><FieldError message={itemErrors[`${idx}-unitPrice`]} /></div>
                  <button className="col-span-1 text-danger-500" onClick={() => setItems(l => l.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-border">
            <p className="text-sm text-ink-500">Subtotal</p>
            <p className="text-lg font-semibold text-ink-900">{formatCurrency(total)}</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>{bill ? 'Save draft changes' : 'Create draft bill'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
