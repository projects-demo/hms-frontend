import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { opdApi } from '@/lib/services/opd'
import type { Appointment, Consultation } from '@/types/domain'
import { apiErrorMessage } from '@/lib/api-client'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { FieldError } from '@/components/common/FieldError'
import { numberError } from '@/lib/validation'

interface RxItem { drugName: string; dosage: string; frequency: string; duration: string; instructions: string }
const EMPTY_RX: RxItem = { drugName: '', dosage: '', frequency: '', duration: '', instructions: '' }

export function ConsultationDialog({ open, onOpenChange, appointment, onDone }: {
  open: boolean; onOpenChange: (o: boolean) => void; appointment: Appointment | null; onDone: () => void
}) {
  const [consultation, setConsultation] = useState<Consultation | null>(null)
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [bp, setBp] = useState('')
  const [pulse, setPulse] = useState('')
  const [temperature, setTemperature] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [spo2, setSpo2] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [notes, setNotes] = useState('')
  const [rxItems, setRxItems] = useState<RxItem[]>([])
  const [starting, setStarting] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [vitalErrors, setVitalErrors] = useState<Record<string, string>>({})

  function reset() {
    setConsultation(null); setChiefComplaint(''); setBp(''); setPulse(''); setTemperature('')
    setWeightKg(''); setHeightCm(''); setSpo2(''); setDiagnosis(''); setNotes(''); setRxItems([])
    setVitalErrors({})
  }

  async function handleStart() {
    if (!appointment) return
    setStarting(true)
    try {
      const c = await opdApi.start({
        appointmentId: appointment.id, patientId: appointment.patientId,
        doctorId: appointment.doctorId, chiefComplaint: chiefComplaint || undefined,
      })
      setConsultation(c)
      toast.success('Consultation started')
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setStarting(false)
    }
  }

  async function handleComplete() {
    if (!consultation) return
    const pressureParts = bp.trim() ? bp.split('/').map(Number) : []
    const temperatureValue = temperature.trim() ? Number(temperature) : undefined
    const oxygenValue = spo2.trim() ? Number(spo2.replace('%', '')) : undefined
    const nextErrors: Record<string, string> = {}
    if (bp.trim() && (!/^\d{2,3}\/\d{2,3}$/.test(bp) || pressureParts[0] < 40 || pressureParts[0] > 300 || pressureParts[1] < 20 || pressureParts[1] > 200)) {
      nextErrors.bp = 'Enter BP as systolic/diastolic (e.g. 120/80).'
    }
    if (pulse.trim()) nextErrors.pulse = numberError(pulse, 'Pulse', 30, 250) ?? ''
    if (temperature.trim() && (!Number.isFinite(temperatureValue) || temperatureValue! < 30 || temperatureValue! > 113)) {
      nextErrors.temperature = 'Enter a temperature between 30 and 113 (°C or °F).'
    }
    if (weightKg.trim()) nextErrors.weightKg = numberError(weightKg, 'Weight', 0.1, 500) ?? ''
    if (heightCm.trim()) nextErrors.heightCm = numberError(heightCm, 'Height', 1, 300) ?? ''
    if (spo2.trim() && (!Number.isFinite(oxygenValue) || oxygenValue! < 0 || oxygenValue! > 100)) {
      nextErrors.spo2 = 'SpO₂ must be between 0 and 100%.'
    }
    setVitalErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) { toast.error('Please correct the highlighted vitals'); return }
    setCompleting(true)
    try {
      await opdApi.complete(consultation.id, {
        vitals: { bp: bp || undefined, pulse: pulse || undefined, temperature: temperature || undefined,
          weightKg: weightKg ? Number(weightKg) : undefined, heightCm: heightCm ? Number(heightCm) : undefined, spo2: spo2 || undefined },
        diagnosis: diagnosis || undefined,
        clinicalNotes: notes || undefined,
        prescriptionItems: rxItems.filter(r => r.drugName.trim()).length > 0
          ? rxItems.filter(r => r.drugName.trim())
          : undefined,
      })
      toast.success('Consultation completed')
      reset()
      onDone()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setCompleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset() }}>
      <DialogContent title={`Consultation — ${appointment?.appointmentCode ?? ''}`} className="max-w-2xl">
        {!consultation ? (
          <div className="space-y-3">
            <div>
              <Label>Chief complaint</Label>
              <Textarea value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)} rows={3} placeholder="What is the patient here for?" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleStart} loading={starting}>Start consultation</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <section>
              <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">Vitals</p>
              <div className="grid grid-cols-3 gap-3">
                  <div><Label>BP</Label><Input maxLength={7} aria-invalid={!!vitalErrors.bp} error={!!vitalErrors.bp} value={bp} onChange={(e) => { setBp(e.target.value); setVitalErrors(current => ({ ...current, bp: '' })) }} placeholder="120/80" /><FieldError message={vitalErrors.bp} /></div>
                  <div><Label>Pulse (bpm)</Label><Input type="number" min={30} max={250} step={1} aria-invalid={!!vitalErrors.pulse} error={!!vitalErrors.pulse} value={pulse} onChange={(e) => { setPulse(e.target.value); setVitalErrors(current => ({ ...current, pulse: '' })) }} placeholder="72" /><FieldError message={vitalErrors.pulse} /></div>
                  <div><Label>Temp (°C or °F)</Label><Input type="number" min={30} max={113} step="0.1" aria-invalid={!!vitalErrors.temperature} error={!!vitalErrors.temperature} value={temperature} onChange={(e) => { setTemperature(e.target.value); setVitalErrors(current => ({ ...current, temperature: '' })) }} placeholder="98.6" /><FieldError message={vitalErrors.temperature} /></div>
                  <div><Label>Weight (kg)</Label><Input type="number" min={0.1} max={500} step="0.1" aria-invalid={!!vitalErrors.weightKg} error={!!vitalErrors.weightKg} value={weightKg} onChange={(e) => { setWeightKg(e.target.value); setVitalErrors(current => ({ ...current, weightKg: '' })) }} /><FieldError message={vitalErrors.weightKg} /></div>
                  <div><Label>Height (cm)</Label><Input type="number" min={1} max={300} step="0.1" aria-invalid={!!vitalErrors.heightCm} error={!!vitalErrors.heightCm} value={heightCm} onChange={(e) => { setHeightCm(e.target.value); setVitalErrors(current => ({ ...current, heightCm: '' })) }} /><FieldError message={vitalErrors.heightCm} /></div>
                  <div><Label>SpO₂ (%)</Label><Input type="number" min={0} max={100} step={1} aria-invalid={!!vitalErrors.spo2} error={!!vitalErrors.spo2} value={spo2} onChange={(e) => { setSpo2(e.target.value); setVitalErrors(current => ({ ...current, spo2: '' })) }} placeholder="98" /><FieldError message={vitalErrors.spo2} /></div>
              </div>
            </section>

            <section>
              <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">Diagnosis & notes</p>
              <div className="space-y-3">
                <div><Label>Diagnosis</Label><Textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} rows={2} /></div>
                <div><Label>Clinical notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} /></div>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Prescription</p>
                <Button size="sm" variant="outline" onClick={() => setRxItems(items => [...items, { ...EMPTY_RX }])}>
                  <Plus className="h-3.5 w-3.5" /> Add drug
                </Button>
              </div>
              {rxItems.length === 0 ? (
                <p className="text-xs text-ink-400">No medications added.</p>
              ) : (
                <div className="space-y-2">
                  {rxItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-1.5 items-center">
                      <Input className="col-span-3" placeholder="Drug name" value={item.drugName}
                        onChange={(e) => setRxItems(items => items.map((it, i) => i === idx ? { ...it, drugName: e.target.value } : it))} />
                      <Input className="col-span-2" placeholder="Dosage" value={item.dosage}
                        onChange={(e) => setRxItems(items => items.map((it, i) => i === idx ? { ...it, dosage: e.target.value } : it))} />
                      <Input className="col-span-2" placeholder="Frequency" value={item.frequency}
                        onChange={(e) => setRxItems(items => items.map((it, i) => i === idx ? { ...it, frequency: e.target.value } : it))} />
                      <Input className="col-span-2" placeholder="Duration" value={item.duration}
                        onChange={(e) => setRxItems(items => items.map((it, i) => i === idx ? { ...it, duration: e.target.value } : it))} />
                      <Input className="col-span-2" placeholder="Instructions" value={item.instructions}
                        onChange={(e) => setRxItems(items => items.map((it, i) => i === idx ? { ...it, instructions: e.target.value } : it))} />
                      <button className="col-span-1 text-danger-500 hover:text-danger-600" onClick={() => setRxItems(items => items.filter((_, i) => i !== idx))}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Save for later</Button>
              <Button onClick={handleComplete} loading={completing}>Complete consultation</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
