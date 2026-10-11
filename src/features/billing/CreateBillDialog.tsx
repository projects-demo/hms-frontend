import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select, SelectItem } from '@/components/ui/Select'
import { AsyncCombobox } from '@/components/common/AsyncCombobox'
import { patientsApi } from '@/lib/services/patients'
import { billingApi } from '@/lib/services/billing'
import type { OptionDto } from '@/types/api'
import { apiErrorMessage } from '@/lib/api-client'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Appointment } from '@/types/domain'

interface LineItem { chargeMasterId?: number; isCustom?: boolean; description: string; quantity: string; unitPrice: string }
const EMPTY_ITEM: LineItem = { description: '', quantity: '1', unitPrice: '0' }

export function CreateBillDialog({ open, onOpenChange, defaultPatient, defaultAppointment }: {
  open: boolean; onOpenChange: (o: boolean) => void; defaultPatient?: OptionDto | null
  defaultAppointment?: Appointment | null
}) {
  const navigate = useNavigate()
  const [patient, setPatient] = useState<OptionDto | null>(defaultPatient ?? null)
  const [billType, setBillType] = useState('OPD')
  const [items, setItems] = useState<LineItem[]>([{ ...EMPTY_ITEM }])
  const [standardItems, setStandardItems] = useState<import('@/types/domain').ChargeMaster[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setPatient(defaultPatient ?? null)
    billingApi.chargeMaster.search({ size: 100 }).then(result => setStandardItems(result.content))
      .catch(err => toast.error(apiErrorMessage(err)))
    setItems(defaultAppointment ? [{
      isCustom: true,
      description: `OPD consultation — ${defaultAppointment.appointmentCode}`,
      quantity: '1',
      unitPrice: String(defaultAppointment.feeAmount),
    }] : [{ ...EMPTY_ITEM }])
  }, [open, defaultPatient, defaultAppointment])

  const total = items.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0)

  function updateItem(idx: number, patch: Partial<LineItem>) {
    setItems(list => list.map((it, i) => i === idx ? { ...it, ...patch } : it))
  }

  function selectStandardItem(idx: number, value: string) {
    if (value === 'custom') {
      updateItem(idx, { chargeMasterId: undefined, isCustom: true, description: '', unitPrice: '0' })
      return
    }
    const standard = standardItems.find(item => String(item.id) === value)
    if (standard) {
      updateItem(idx, { chargeMasterId: standard.id, isCustom: false, description: standard.name, unitPrice: String(standard.defaultPrice) })
    }
  }

  async function handleSubmit() {
    if (!patient) { toast.error('Select a patient'); return }
    const validItems = items.filter(i => i.description.trim() && Number(i.unitPrice) >= 0)
    if (validItems.length === 0) { toast.error('Add at least one line item'); return }
    setSaving(true)
    try {
      const bill = await billingApi.bills.create({
        patientId: patient.id,
        appointmentId: defaultAppointment?.id,
        billType,
        items: validItems.map(i => ({ chargeMasterId: i.chargeMasterId, description: i.description, quantity: Number(i.quantity) || 1, unitPrice: Number(i.unitPrice) })),
      })
      toast.success('Bill created as draft')
      onOpenChange(false)
      setItems([{ ...EMPTY_ITEM }])
      setPatient(null)
      navigate(`/billing/${bill.id}`)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Create bill" className="max-w-xl">
        <div className="space-y-4">
          <div>
            <Label>Patient *</Label>
            {defaultAppointment ? (
              <div className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink-700">
                {patient?.label ?? `Patient #${defaultAppointment.patientId}`}
                {patient?.subLabel && <span className="ml-2 text-xs text-ink-400">{patient.subLabel}</span>}
              </div>
            ) : (
              <AsyncCombobox value={patient} onChange={setPatient} fetchOptions={(q) => patientsApi.autocomplete(q)} placeholder="Search patient" />
            )}
          </div>
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
                  <div className="col-span-6">
                    <Select value={item.chargeMasterId ? String(item.chargeMasterId) : item.isCustom ? 'custom' : ''} onValueChange={(value) => selectStandardItem(idx, value)} placeholder="Select standard item">
                      {!defaultAppointment && <SelectItem value="custom">Custom item</SelectItem>}
                      {standardItems.map(standard => (
                        <SelectItem key={standard.id} value={String(standard.id)}>{standard.name} — {formatCurrency(standard.defaultPrice)}</SelectItem>
                      ))}
                    </Select>
                    {item.isCustom && (
                      <Input className="mt-1" placeholder="Description" value={item.description} onChange={(e) => updateItem(idx, { description: e.target.value })} />
                    )}
                  </div>
                  <Input className="col-span-2" type="number" min={1} placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(idx, { quantity: e.target.value })} />
                  <Input className="col-span-3" type="number" min={0} placeholder="Unit price" value={item.unitPrice} disabled={!!item.chargeMasterId} onChange={(e) => updateItem(idx, { unitPrice: e.target.value })} />
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
            <Button onClick={handleSubmit} loading={saving}>Create draft bill</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
