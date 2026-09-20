import { useEffect, useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectItem } from '@/components/ui/Select'
import { AsyncCombobox } from '@/components/common/AsyncCombobox'
import { patientsApi } from '@/lib/services/patients'
import { doctorsApi } from '@/lib/services/doctors'
import { ipdApi } from '@/lib/services/ipd'
import type { OptionDto } from '@/types/api'
import type { Bed } from '@/types/domain'
import { apiErrorMessage } from '@/lib/api-client'
import { toast } from 'sonner'

export function AdmitPatientDialog({ open, onOpenChange, onAdmitted }: { open: boolean; onOpenChange: (o: boolean) => void; onAdmitted: () => void }) {
  const [patient, setPatient] = useState<OptionDto | null>(null)
  const [doctor, setDoctor] = useState<OptionDto | null>(null)
  const [bedId, setBedId] = useState('')
  const [beds, setBeds] = useState<Bed[]>([])
  const [admissionType, setAdmissionType] = useState('PLANNED')
  const [reason, setReason] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) ipdApi.availableBeds().then(setBeds).catch(() => {})
  }, [open])

  function reset() {
    setPatient(null); setDoctor(null); setBedId(''); setAdmissionType('PLANNED'); setReason(''); setDiagnosis('')
  }

  async function handleSubmit() {
    if (!patient || !doctor || !bedId) { toast.error('Patient, doctor and bed are required'); return }
    setSaving(true)
    try {
      await ipdApi.admit({
        patientId: patient.id, admittingDoctorId: doctor.id, bedId: Number(bedId),
        admissionType, reasonForAdmission: reason || undefined, provisionalDiagnosis: diagnosis || undefined,
      })
      toast.success('Patient admitted')
      reset()
      onAdmitted()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset() }}>
      <DialogContent title="Admit patient" className="max-w-lg">
        <div className="space-y-3">
          <div>
            <Label>Patient *</Label>
            <AsyncCombobox value={patient} onChange={setPatient} fetchOptions={(q) => patientsApi.autocomplete(q)} placeholder="Search patient" />
          </div>
          <div>
            <Label>Admitting doctor *</Label>
            <AsyncCombobox value={doctor} onChange={setDoctor} fetchOptions={(q) => doctorsApi.autocomplete(q)} placeholder="Search doctor" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Available bed *</Label>
              <Select value={bedId} onValueChange={setBedId} placeholder={beds.length === 0 ? 'No beds available' : 'Select bed'}>
                {beds.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.wardName} — {b.bedNumber}</SelectItem>)}
              </Select>
            </div>
            <div>
              <Label>Admission type</Label>
              <Select value={admissionType} onValueChange={setAdmissionType}>
                <SelectItem value="PLANNED">Planned</SelectItem>
                <SelectItem value="EMERGENCY">Emergency</SelectItem>
                <SelectItem value="TRANSFER">Transfer</SelectItem>
              </Select>
            </div>
          </div>
          <div><Label>Reason for admission</Label><Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} /></div>
          <div><Label>Provisional diagnosis</Label><Textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} rows={2} /></div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>Admit patient</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
