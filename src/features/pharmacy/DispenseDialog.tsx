import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { AsyncCombobox } from '@/components/common/AsyncCombobox'
import { patientsApi } from '@/lib/services/patients'
import { pharmacyApi } from '@/lib/services/pharmacy'
import type { OptionDto } from '@/types/api'
import { apiErrorMessage } from '@/lib/api-client'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { FieldError } from '@/components/common/FieldError'

interface DrugLine { drug: OptionDto | null; quantity: string }

export function DispenseDialog({ open, onOpenChange, onDispensed }: { open: boolean; onOpenChange: (o: boolean) => void; onDispensed: () => void }) {
  const [patient, setPatient] = useState<OptionDto | null>(null)
  const [lines, setLines] = useState<DrugLine[]>([{ drug: null, quantity: '1' }])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function reset() { setPatient(null); setLines([{ drug: null, quantity: '1' }]); setErrors({}) }

  async function handleSubmit() {
    const nextErrors: Record<string, string> = { patient: patient ? '' : 'Select a patient.' }
    lines.forEach((line, idx) => {
      if (!line.drug) nextErrors[`${idx}-drug`] = 'Select a drug.'
      const quantity = Number(line.quantity)
      if (!Number.isInteger(quantity) || quantity < 1) nextErrors[`${idx}-quantity`] = 'Quantity must be a whole number of at least 1.'
    })
    setErrors(nextErrors)
    if (!patient || Object.values(nextErrors).some(Boolean)) { toast.error('Please correct the highlighted fields'); return }
    const validLines = lines
    setSaving(true)
    try {
      await pharmacyApi.dispenses.create({
        patientId: patient.id,
        items: validLines.map(l => ({ drugId: l.drug!.id, quantity: Number(l.quantity) })),
      })
      toast.success('Dispensed successfully')
      reset()
      onDispensed()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset() }}>
      <DialogContent title="Dispense medication" description="Stock is deducted FEFO (soonest-expiring batches first)." className="max-w-lg">
        <div className="space-y-4">
          <div>
            <Label>Patient *</Label>
            <AsyncCombobox value={patient} onChange={(value) => { setPatient(value); setErrors(current => ({ ...current, patient: '' })) }} fetchOptions={(q) => patientsApi.autocomplete(q)} placeholder="Search patient" />
            <FieldError message={errors.patient} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="mb-0">Drugs</Label>
              <Button size="sm" variant="outline" onClick={() => setLines(l => [...l, { drug: null, quantity: '1' }])}>
                <Plus className="h-3.5 w-3.5" /> Add drug
              </Button>
            </div>
            <div className="space-y-2">
              {lines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-1.5 items-center">
                  <div className="col-span-8">
                    <AsyncCombobox
                      value={line.drug}
                      onChange={(d) => { setLines(ls => ls.map((l, i) => i === idx ? { ...l, drug: d } : l)); setErrors(current => ({ ...current, [`${idx}-drug`]: '' })) }}
                      fetchOptions={(q) => pharmacyApi.drugs.autocomplete(q)}
                      placeholder="Search drug"
                    />
                  </div>
                  <div className="col-span-3"><Input type="number" min={1} step={1} aria-invalid={!!errors[`${idx}-quantity`]} error={!!errors[`${idx}-quantity`]} placeholder="Qty" value={line.quantity}
                    onChange={(e) => { setLines(ls => ls.map((l, i) => i === idx ? { ...l, quantity: e.target.value } : l)); setErrors(current => ({ ...current, [`${idx}-quantity`]: '' })) }} /><FieldError message={errors[`${idx}-quantity`]} /></div>
                  <button className="col-span-1 text-danger-500" onClick={() => setLines(ls => ls.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>Dispense</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
