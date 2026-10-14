import { useEffect, useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'
import { Input } from '@/components/ui/Input'
import { Select, SelectItem } from '@/components/ui/Select'
import { AsyncCombobox } from '@/components/common/AsyncCombobox'
import { patientsApi } from '@/lib/services/patients'
import { doctorsApi } from '@/lib/services/doctors'
import { departmentsApi } from '@/lib/services/departments'
import { appointmentsApi } from '@/lib/services/appointments'
import type { OptionDto } from '@/types/api'
import type { AppointmentSlot, Department, Doctor } from '@/types/domain'
import { formatTime } from '@/lib/utils'
import { apiErrorMessage } from '@/lib/api-client'
import { toast } from 'sonner'
import { CalendarClock, Loader2 } from 'lucide-react'
import { FieldError } from '@/components/common/FieldError'

export function BookAppointmentDialog({ open, onOpenChange, onBooked }: {
  open: boolean; onOpenChange: (o: boolean) => void; onBooked: () => void
}) {
  const [patient, setPatient] = useState<OptionDto | null>(null)

  const [departments, setDepartments] = useState<Department[]>([])
  const [departmentId, setDepartmentId] = useState('')
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [doctorId, setDoctorId] = useState('')
  const [loadingDoctors, setLoadingDoctors] = useState(false)

  const [date, setDate] = useState('')
  const [appointmentType, setAppointmentType] = useState<'NEW' | 'FOLLOWUP'>('NEW')
  const [freeVisit, setFreeVisit] = useState(false)
  const [notes, setNotes] = useState('')

  const [slots, setSlots] = useState<AppointmentSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [booking, setBooking] = useState(false)
  const [errors, setErrors] = useState({ patient: '', departmentId: '', doctorId: '', date: '' })

  // Load departments once, when the dialog first opens.
  useEffect(() => {
    if (open && departments.length === 0) {
      departmentsApi.list({ size: 100 }).then(r => setDepartments(r.content)).catch(() => {})
    }
  }, [open, departments.length])

  // Whenever the department changes, load just that department's doctors.
  useEffect(() => {
    setDoctorId('')
    setDoctors([])
    setSlots([])
    setSelectedSlot(null)
    if (!departmentId) return
    setLoadingDoctors(true)
    doctorsApi.list({ departmentId: Number(departmentId), size: 100 })
      .then(r => setDoctors(r.content))
      .catch((err) => toast.error(apiErrorMessage(err)))
      .finally(() => setLoadingDoctors(false))
  }, [departmentId])

  function reset() {
    setPatient(null); setDepartmentId(''); setDoctors([]); setDoctorId('')
    setDate(''); setAppointmentType('NEW'); setFreeVisit(false); setNotes('')
    setSlots([]); setSelectedSlot(null)
    setErrors({ patient: '', departmentId: '', doctorId: '', date: '' })
  }

  async function loadSlots() {
    if (!doctorId || !date) { toast.error('Pick a department, doctor and date first'); return }
    setLoadingSlots(true)
    setSelectedSlot(null)
    try {
      let available = await appointmentsApi.availableSlots(Number(doctorId), date)
      if (available.length === 0) {
        // No slots materialized yet for this date - generate from the doctor's weekly template.
        await appointmentsApi.generateSlots(Number(doctorId), date)
        available = await appointmentsApi.availableSlots(Number(doctorId), date)
      }
      setSlots(available)
      if (available.length === 0) toast.info('No available slots - the doctor may not have availability set for this day')
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setLoadingSlots(false)
    }
  }

  async function handleBook() {
    const nextErrors = {
      patient: patient ? '' : 'Select a patient.',
      departmentId: departmentId ? '' : 'Select a department.',
      doctorId: doctorId ? '' : 'Select a doctor.',
      date: date ? '' : 'Choose an appointment date.',
    }
    setErrors(nextErrors)
    if (!patient || Object.values(nextErrors).some(Boolean)) { toast.error('Please correct the highlighted fields'); return }
    setBooking(true)
    try {
      await appointmentsApi.book({
        patientId: patient.id, doctorId: Number(doctorId), slotId: selectedSlot?.id,
        appointmentDate: date, appointmentType, freeVisit, notes: notes || undefined,
      })
      toast.success('Appointment booked')
      reset()
      onBooked()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setBooking(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset() }}>
      <DialogContent title="Book appointment" className="max-w-lg">
        <div className="space-y-4">
          <div>
            <Label>Patient *</Label>
            <AsyncCombobox value={patient} onChange={(value) => { setPatient(value); setErrors(current => ({ ...current, patient: '' })) }} fetchOptions={(q) => patientsApi.autocomplete(q)} placeholder="Search patient by name or phone" />
            <FieldError message={errors.patient} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Department *</Label>
              <Select value={departmentId} onValueChange={(value) => { setDepartmentId(value); setErrors(current => ({ ...current, departmentId: '', doctorId: '' })) }} placeholder="Select department" className={errors.departmentId ? 'border-danger-500' : undefined}>
                {departments.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
              </Select>
              <FieldError message={errors.departmentId} />
            </div>
            <div>
              <Label>Doctor *</Label>
              <Select
                value={doctorId}
                onValueChange={(value) => { setDoctorId(value); setErrors(current => ({ ...current, doctorId: '' })) }}
                placeholder={!departmentId ? 'Pick a department first' : loadingDoctors ? 'Loading...' : doctors.length === 0 ? 'No doctors in this department' : 'Select doctor'}
                disabled={!departmentId || loadingDoctors || doctors.length === 0}
                className={errors.doctorId ? 'border-danger-500' : undefined}
              >
                {doctors.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.fullName} — {d.specialization}</SelectItem>)}
              </Select>
              <FieldError message={errors.doctorId} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date *</Label>
              <Input type="date" required min={new Date().toISOString().slice(0, 10)} aria-invalid={!!errors.date} error={!!errors.date} value={date} onChange={(e) => { setDate(e.target.value); setSlots([]); setSelectedSlot(null); setErrors(current => ({ ...current, date: '' })) }} />
              <FieldError message={errors.date} />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={appointmentType} onValueChange={(v) => setAppointmentType(v as never)}>
                <SelectItem value="NEW">New visit</SelectItem>
                <SelectItem value="FOLLOWUP">Follow-up</SelectItem>
              </Select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="mb-0">Time slot</Label>
              <Button size="sm" variant="outline" onClick={loadSlots} loading={loadingSlots} disabled={!doctorId || !date}>
                <CalendarClock className="h-3.5 w-3.5" /> Load slots
              </Button>
            </div>
            {loadingSlots ? (
              <div className="flex items-center gap-2 text-sm text-ink-400 py-3"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
            ) : slots.length > 0 ? (
              <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto scrollbar-thin p-0.5">
                {slots.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSlot(s)}
                    className={`rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                      selectedSlot?.id === s.id
                        ? 'border-primary-600 bg-primary-600 text-white'
                        : 'border-border-strong bg-surface text-ink-700 hover:border-primary-400'
                    }`}
                  >
                    {formatTime(s.startTime)}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-ink-400">No slot picked yet — you can still book without a specific slot.</p>
            )}
          </div>

          <div>
            <Label>Notes</Label>
            <Input maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
          </div>

          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" checked={freeVisit} onChange={(e) => setFreeVisit(e.target.checked)} className="rounded border-border-strong" />
            Free visit (no consultation fee)
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleBook} loading={booking}>Book appointment</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}