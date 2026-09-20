import { useEffect, useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select, SelectItem } from '@/components/ui/Select'
import { patientsApi } from '@/lib/services/patients'
import type { Patient } from '@/types/domain'
import { apiErrorMessage } from '@/lib/api-client'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
  patient?: Patient | null
}

const EMPTY = {
  firstName: '', lastName: '', dob: '', gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
  primaryPhone: '', secondaryPhone: '', email: '',
  emergencyName: '', emergencyContact: '',
  street: '', city: '', state: '', country: 'India', zipCode: '',
  insuranceProvider: '', policyNumber: '',
}

export function PatientFormDialog({ open, onOpenChange, onSaved, patient }: Props) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const isEdit = !!patient

  useEffect(() => {
    if (open) {
      setForm(patient ? {
        firstName: patient.firstName, lastName: patient.lastName, dob: patient.dob ?? '',
        gender: patient.gender, primaryPhone: patient.primaryPhone, secondaryPhone: patient.secondaryPhone ?? '',
        email: patient.email ?? '', emergencyName: patient.emergencyName ?? '', emergencyContact: patient.emergencyContact ?? '',
        street: patient.street ?? '', city: patient.city ?? '', state: patient.state ?? '', country: patient.country ?? 'India',
        zipCode: patient.zipCode ?? '', insuranceProvider: patient.insuranceProvider ?? '', policyNumber: patient.policyNumber ?? '',
      } : EMPTY)
    }
  }, [open, patient])

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit() {
    if (!form.firstName || !form.lastName || !form.primaryPhone) {
      toast.error('First name, last name and phone are required')
      return
    }
    setSaving(true)
    try {
      const payload = { ...form, dob: form.dob || undefined }
      if (isEdit && patient) {
        await patientsApi.update(patient.id, payload as never)
        toast.success('Patient updated')
      } else {
        await patientsApi.create(payload as never)
        toast.success('Patient registered')
      }
      onSaved()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={isEdit ? 'Edit patient' : 'Register new patient'} className="max-w-2xl">
        <div className="space-y-5">
          <section>
            <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">Basic details</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>First name *</Label><Input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} /></div>
              <div><Label>Last name *</Label><Input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} /></div>
              <div><Label>Date of birth</Label><Input type="date" value={form.dob} onChange={(e) => set('dob', e.target.value)} /></div>
              <div>
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={(v) => set('gender', v as never)}>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </Select>
              </div>
            </div>
          </section>

          <section>
            <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">Contact</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Primary phone *</Label><Input value={form.primaryPhone} onChange={(e) => set('primaryPhone', e.target.value)} /></div>
              <div><Label>Secondary phone</Label><Input value={form.secondaryPhone} onChange={(e) => set('secondaryPhone', e.target.value)} /></div>
              <div className="col-span-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
              <div><Label>Emergency contact name</Label><Input value={form.emergencyName} onChange={(e) => set('emergencyName', e.target.value)} /></div>
              <div><Label>Emergency contact phone</Label><Input value={form.emergencyContact} onChange={(e) => set('emergencyContact', e.target.value)} /></div>
            </div>
          </section>

          <section>
            <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">Address</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Street</Label><Input value={form.street} onChange={(e) => set('street', e.target.value)} /></div>
              <div><Label>City</Label><Input value={form.city} onChange={(e) => set('city', e.target.value)} /></div>
              <div><Label>State</Label><Input value={form.state} onChange={(e) => set('state', e.target.value)} /></div>
              <div><Label>Country</Label><Input value={form.country} onChange={(e) => set('country', e.target.value)} /></div>
              <div><Label>Postal code</Label><Input value={form.zipCode} onChange={(e) => set('zipCode', e.target.value)} /></div>
            </div>
          </section>

          <section>
            <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">Insurance (optional)</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Insurance provider</Label><Input value={form.insuranceProvider} onChange={(e) => set('insuranceProvider', e.target.value)} /></div>
              <div><Label>Policy number</Label><Input value={form.policyNumber} onChange={(e) => set('policyNumber', e.target.value)} /></div>
            </div>
          </section>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>{isEdit ? 'Save changes' : 'Register patient'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
