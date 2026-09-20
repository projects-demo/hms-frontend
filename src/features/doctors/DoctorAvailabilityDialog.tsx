import { useEffect, useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select, SelectItem } from '@/components/ui/Select'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { PageSpinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { doctorsApi } from '@/lib/services/doctors'
import type { Doctor, DoctorAvailability } from '@/types/domain'
import { formatTime } from '@/lib/utils'
import { apiErrorMessage } from '@/lib/api-client'
import { toast } from 'sonner'
import { Plus, CalendarDays } from 'lucide-react'

const DAYS = [
  { value: '1', label: 'Monday' }, { value: '2', label: 'Tuesday' }, { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' }, { value: '5', label: 'Friday' }, { value: '6', label: 'Saturday' },
  { value: '7', label: 'Sunday' },
]
const DAY_LABEL: Record<number, string> = Object.fromEntries(DAYS.map(d => [Number(d.value), d.label]))

export function DoctorAvailabilityDialog({ open, onOpenChange, doctor }: {
  open: boolean; onOpenChange: (o: boolean) => void; doctor: Doctor | null
}) {
  const [availability, setAvailability] = useState<DoctorAvailability[]>([])
  const [loading, setLoading] = useState(true)
  const [dayOfWeek, setDayOfWeek] = useState('1')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('13:00')
  const [slotDurationMins, setSlotDurationMins] = useState('15')
  const [saving, setSaving] = useState(false)

  function load() {
    if (!doctor) return
    setLoading(true)
    doctorsApi.listAvailability(doctor.id)
      .then(setAvailability)
      .catch((err) => toast.error(apiErrorMessage(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { if (open && doctor) load() }, [open, doctor]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAdd() {
    if (!doctor) return
    if (startTime >= endTime) { toast.error('End time must be after start time'); return }
    setSaving(true)
    try {
      await doctorsApi.addAvailability(doctor.id, {
        dayOfWeek: Number(dayOfWeek),
        startTime: `${startTime}:00`,
        endTime: `${endTime}:00`,
        slotDurationMins: Number(slotDurationMins),
      })
      toast.success('Availability window added')
      load()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={`Weekly availability — ${doctor?.specialization ?? ''}`}
        description="These windows are what the appointment booking screen uses to generate bookable time slots."
        className="max-w-lg"
      >
        <div className="space-y-5">
          <section>
            <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">Current windows</p>
            {loading ? <PageSpinner /> : availability.length === 0 ? (
              <EmptyState
                icon={<CalendarDays className="h-8 w-8" />}
                title="No availability set yet"
                description="Add a weekly window below - e.g. Monday 9am-1pm - so patients can be booked with this doctor."
              />
            ) : (
              <Table>
                <THead><TR><TH>Day</TH><TH>Time</TH><TH>Slot length</TH></TR></THead>
                <TBody>
                  {availability
                    .slice()
                    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                    .map(a => (
                      <TR key={a.id}>
                        <TD className="font-medium text-ink-900">{DAY_LABEL[a.dayOfWeek]}</TD>
                        <TD>{formatTime(a.startTime)} – {formatTime(a.endTime)}</TD>
                        <TD>{a.slotDurationMins} min</TD>
                      </TR>
                    ))}
                </TBody>
              </Table>
            )}
          </section>

          <section>
            <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">Add a window</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Day of week</Label>
                <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                  {DAYS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                </Select>
              </div>
              <div>
                <Label>Slot length</Label>
                <Select value={slotDurationMins} onValueChange={setSlotDurationMins}>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="20">20 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                </Select>
              </div>
              <div><Label>Start time</Label><Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></div>
              <div><Label>End time</Label><Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} /></div>
            </div>
            <Button className="w-full mt-3" onClick={handleAdd} loading={saving}>
              <Plus className="h-4 w-4" /> Add window
            </Button>
          </section>

          <div className="flex justify-end pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
