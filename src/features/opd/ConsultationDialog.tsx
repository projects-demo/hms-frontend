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

  function reset() {
    setConsultation(null); setChiefComplaint(''); setBp(''); setPulse(''); setTemperature('')
    setWeightKg(''); setHeightCm(''); setSpo2(''); setDiagnosis(''); setNotes(''); setRxItems([])
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
                <div><Label>BP</Label><Input value={bp} onChange={(e) => setBp(e.target.value)} placeholder="120/80" /></div>
                <div><Label>Pulse</Label><Input value={pulse} onChange={(e) => setPulse(e.target.value)} placeholder="72 bpm" /></div>
                <div><Label>Temp</Label><Input value={temperature} onChange={(e) => setTemperature(e.target.value)} placeholder="98.6°F" /></div>
                <div><Label>Weight (kg)</Label><Input type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} /></div>
                <div><Label>Height (cm)</Label><Input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} /></div>
                <div><Label>SpO2</Label><Input value={spo2} onChange={(e) => setSpo2(e.target.value)} placeholder="98%" /></div>
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
