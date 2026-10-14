import { useEffect, useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select, SelectItem } from '@/components/ui/Select'
import { patientsApi } from '@/lib/services/patients'
import type { Patient } from '@/types/domain'
import { apiErrorMessage } from '@/lib/api-client'
import { FieldError } from '@/components/common/FieldError'
import { PhoneInput } from '@/components/common/PhoneInput'
import { emailError, integerError, phoneError, requiredError } from '@/lib/validation'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
  patient?: Patient | null
}

const EMPTY = {
  firstName: '', lastName: '', dob: '', ageYears: '', gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
  primaryPhone: '', secondaryPhone: '', email: '',
  emergencyName: '', emergencyContact: '',
  street: '', city: '', state: '', country: 'India', zipCode: '',
  insuranceProvider: '', policyNumber: '',
}

export function PatientFormDialog({ open, onOpenChange, onSaved, patient }: Props) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof typeof EMPTY, string>>>({})
  const isEdit = !!patient

  useEffect(() => {
    if (open) {
      setForm(patient ? {
        firstName: patient.firstName, lastName: patient.lastName, dob: patient.dob ?? '',
        ageYears: patient.age != null ? String(patient.age) : '',
        gender: patient.gender, primaryPhone: patient.primaryPhone, secondaryPhone: patient.secondaryPhone ?? '',
        email: patient.email ?? '', emergencyName: patient.emergencyName ?? '', emergencyContact: patient.emergencyContact ?? '',
        street: patient.street ?? '', city: patient.city ?? '', state: patient.state ?? '', country: patient.country ?? 'India',
        zipCode: patient.zipCode ?? '', insuranceProvider: patient.insuranceProvider ?? '', policyNumber: patient.policyNumber ?? '',
      } : EMPTY)
      setErrors({})
    }
  }, [open, patient])

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  async function handleSubmit() {
    const nextErrors: Partial<Record<keyof typeof EMPTY, string>> = {
      firstName: requiredError(form.firstName, 'First name'),
      lastName: requiredError(form.lastName, 'Last name'),
      ageYears: integerError(form.ageYears, 'Age', 1, 130, true),
      primaryPhone: phoneError(form.primaryPhone, true),
      secondaryPhone: phoneError(form.secondaryPhone),
      emergencyContact: phoneError(form.emergencyContact),
      email: emailError(form.email),
    }
    if (form.dob && form.dob > new Date().toISOString().slice(0, 10)) {
      nextErrors.dob = 'Date of birth cannot be in the future.'
    }
    setErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) {
      toast.error('Please correct the highlighted fields')
      return
    }
    setSaving(true)
    try {
      const payload = { ...form, dob: form.dob || undefined, ageYears: Number(form.ageYears) }
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
        <form className="space-y-5" noValidate onSubmit={(event) => { event.preventDefault(); void handleSubmit() }}>
          <section>
            <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">Basic details</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>First name *</Label><Input required maxLength={50} aria-invalid={!!errors.firstName} error={!!errors.firstName} value={form.firstName} onChange={(e) => set('firstName', e.target.value)} /><FieldError message={errors.firstName} /></div>
              <div><Label>Last name *</Label><Input required maxLength={50} aria-invalid={!!errors.lastName} error={!!errors.lastName} value={form.lastName} onChange={(e) => set('lastName', e.target.value)} /><FieldError message={errors.lastName} /></div>
              <div><Label>Age *</Label><Input type="number" min={1} max={130} step={1} required aria-invalid={!!errors.ageYears} error={!!errors.ageYears} value={form.ageYears} onChange={(e) => set('ageYears', e.target.value)} /><FieldError message={errors.ageYears} /></div>
              <div><Label>Date of birth</Label><Input type="date" max={new Date().toISOString().slice(0, 10)} aria-invalid={!!errors.dob} error={!!errors.dob} value={form.dob} onChange={(e) => set('dob', e.target.value)} /><FieldError message={errors.dob} /></div>
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
              <div><Label>Primary phone *</Label><PhoneInput required aria-invalid={!!errors.primaryPhone} error={!!errors.primaryPhone} value={form.primaryPhone} onChange={(value) => set('primaryPhone', value)} /><FieldError message={errors.primaryPhone} /></div>
              <div><Label>Secondary phone</Label><PhoneInput aria-invalid={!!errors.secondaryPhone} error={!!errors.secondaryPhone} value={form.secondaryPhone} onChange={(value) => set('secondaryPhone', value)} /><FieldError message={errors.secondaryPhone} /></div>
              <div className="col-span-2"><Label>Email</Label><Input type="email" maxLength={150} aria-invalid={!!errors.email} error={!!errors.email} value={form.email} onChange={(e) => set('email', e.target.value)} /><FieldError message={errors.email} /></div>
              <div><Label>Emergency contact name</Label><Input maxLength={100} value={form.emergencyName} onChange={(e) => set('emergencyName', e.target.value)} /></div>
              <div><Label>Emergency contact phone</Label><PhoneInput aria-invalid={!!errors.emergencyContact} error={!!errors.emergencyContact} value={form.emergencyContact} onChange={(value) => set('emergencyContact', value)} /><FieldError message={errors.emergencyContact} /></div>
            </div>
          </section>

          <section>
            <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">Address</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Street</Label><Input maxLength={255} value={form.street} onChange={(e) => set('street', e.target.value)} /></div>
              <div><Label>City</Label><Input maxLength={100} value={form.city} onChange={(e) => set('city', e.target.value)} /></div>
              <div><Label>State</Label><Input maxLength={100} value={form.state} onChange={(e) => set('state', e.target.value)} /></div>
              <div><Label>Country</Label><Input maxLength={100} value={form.country} onChange={(e) => set('country', e.target.value)} /></div>
              <div><Label>Postal code</Label><Input maxLength={20} value={form.zipCode} onChange={(e) => set('zipCode', e.target.value)} /></div>
            </div>
          </section>

          <section>
            <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">Insurance (optional)</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Insurance provider</Label><Input maxLength={100} value={form.insuranceProvider} onChange={(e) => set('insuranceProvider', e.target.value)} /></div>
              <div><Label>Policy number</Label><Input maxLength={100} value={form.policyNumber} onChange={(e) => set('policyNumber', e.target.value)} /></div>
            </div>
          </section>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{isEdit ? 'Save changes' : 'Register patient'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}