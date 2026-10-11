import { useState } from 'react'
import { Plus, CalendarClock, Ban, Receipt } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination } from '@/components/common/Pagination'
import { Card } from '@/components/ui/Card'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Select, SelectItem } from '@/components/ui/Select'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { usePaginated } from '@/hooks/usePaginated'
import { appointmentsApi } from '@/lib/services/appointments'
import { billingApi } from '@/lib/services/billing'
import { patientsApi } from '@/lib/services/patients'
import type { Appointment, AppointmentStatus } from '@/types/domain'
import type { OptionDto } from '@/types/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { apiErrorMessage } from '@/lib/api-client'
import { toast } from 'sonner'
import { BookAppointmentDialog } from './BookAppointmentDialog'
import { CreateBillDialog } from '@/features/billing/CreateBillDialog'
import { useAuth } from '@/features/auth/AuthContext'
import { ROLE_GROUPS, hasRole } from '@/lib/permissions'

const STATUSES: AppointmentStatus[] = ['SCHEDULED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'NO_SHOW']
const NEXT_STATUS: Partial<Record<AppointmentStatus, AppointmentStatus>> = { SCHEDULED: 'CHECKED_IN' }
// Mirrors AppointmentService.validateTransition on the backend - only these statuses can move to CANCELLED.
const CANCELLABLE: AppointmentStatus[] = ['SCHEDULED', 'CHECKED_IN']

export default function AppointmentsPage() {
  const [searchParams] = useSearchParams()
  const [date, setDate] = useState(searchParams.get('date') ?? '')
  const [status, setStatus] = useState<string>(searchParams.get('status') ?? 'ALL')
  const [bookOpen, setBookOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [billingAppointment, setBillingAppointment] = useState<Appointment | null>(null)
  const [billingPatient, setBillingPatient] = useState<OptionDto | null>(null)
  const [openingBillFor, setOpeningBillFor] = useState<number | null>(null)
  const navigate = useNavigate()
  const { session } = useAuth()
  const isAdmin = session?.role === 'HOSPITAL_ADMIN'
  // Front-desk roles can book/check-in; BILLING_STAFF can view appointments (for billing context) but not action them.
  const canBookOrCheckIn = hasRole(session?.role, ROLE_GROUPS.FRONT_DESK)
  const canBill = hasRole(session?.role, ROLE_GROUPS.BILLING)

  const { data, loading, page, setPage, reload } = usePaginated(
    (page, size) => appointmentsApi.search({
      date: date || undefined,
      status: status === 'ALL' ? undefined : (status as AppointmentStatus),
      page, size,
    }),
    [date, status],
  )

  async function handleCheckIn(id: number) {
    try {
      await appointmentsApi.changeStatus(id, 'CHECKED_IN')
      toast.success('Patient checked in')
      reload()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  async function handleOpenBilling(appointment: Appointment) {
    setOpeningBillFor(appointment.id)
    try {
      const patientBills = await billingApi.bills.search({ patientId: appointment.patientId, size: 100 })
      const activeBill = patientBills.content.find(b => b.appointmentId === appointment.id && b.status !== 'CANCELLED')
      if (activeBill) {
        navigate(`/billing/${activeBill.id}`)
        return
      }

      const patient = await patientsApi.get(appointment.patientId)
      setBillingPatient({
        id: patient.id,
        label: `${patient.firstName} ${patient.lastName}`,
        subLabel: patient.patientCode,
      })
      setBillingAppointment(appointment)
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setOpeningBillFor(null)
    }
  }

  async function handleCancel() {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await appointmentsApi.changeStatus(cancelTarget.id, 'CANCELLED')
      toast.success('Appointment cancelled')
      setCancelTarget(null)
      reload()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Appointments"
        description="Book, track and manage OPD appointments."
        actions={canBookOrCheckIn ? <Button onClick={() => setBookOpen(true)}><Plus className="h-4 w-4" /> Book appointment</Button> : undefined}
      />

      <Card>
        <div className="p-4 border-b border-border flex flex-wrap items-center gap-2">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
          <Select value={status} onValueChange={setStatus} className="w-48">
            <SelectItem value="ALL">All statuses</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}
          </Select>
          {(date || status !== 'ALL') && (
            <Button variant="ghost" size="sm" onClick={() => { setDate(''); setStatus('ALL') }}>Clear filters</Button>
          )}
        </div>

        {loading ? <PageSpinner /> : !data || data.content.length === 0 ? (
          <EmptyState icon={<CalendarClock className="h-10 w-10" />} title="No appointments found"
            description="Try adjusting your filters, or book a new appointment."
            action={canBookOrCheckIn ? <Button onClick={() => setBookOpen(true)}><Plus className="h-4 w-4" /> Book appointment</Button> : undefined}
          />
        ) : (
          <>
            <Table>
              <THead><TR><TH>Code</TH><TH>Date</TH><TH>Doctor</TH><TH>Queue No.</TH><TH>Type</TH><TH>Fee</TH><TH>Payment</TH><TH>Status</TH><TH></TH></TR></THead>
              <TBody>
                {data.content.map(a => (
                  <TR key={a.id}>
                    <TD className="font-mono text-xs cursor-pointer" onClick={() => navigate(`/patients/${a.patientId}`)}>{a.appointmentCode}</TD>
                    <TD>{formatDate(a.appointmentDate)}</TD>
                    <TD>{a.doctorName || '—'}</TD>
                    <TD className="font-mono text-xs">{a.queueNumber == null ? '—' : `Q-${String(a.queueNumber).padStart(2, '0')}`}</TD>
                    <TD>{a.appointmentType}</TD>
                    <TD>{a.freeVisit ? 'Free' : formatCurrency(a.feeAmount)}</TD>
                    <TD><Badge variant={a.paid || a.freeVisit ? 'success' : 'warning'}>{a.paid || a.freeVisit ? 'PAID' : 'PENDING'}</Badge></TD>
                    <TD><StatusBadge status={a.status} /></TD>
                    <TD className="text-right">
                      <div className="flex justify-end gap-2">
                        {canBookOrCheckIn && NEXT_STATUS[a.status] && (a.paid || a.freeVisit) && (
                          <Button size="sm" variant="outline" onClick={() => handleCheckIn(a.id)}>Check in</Button>
                        )}
                        {canBill && !a.paid && !a.freeVisit && a.status !== 'CANCELLED' && a.status !== 'NO_SHOW' && (
                          <Button size="sm" variant="outline" onClick={() => handleOpenBilling(a)} loading={openingBillFor === a.id}>
                            <Receipt className="h-3.5 w-3.5" /> Billing
                          </Button>
                        )}
                        {canBookOrCheckIn && NEXT_STATUS[a.status] && !a.paid && !a.freeVisit && (
                          <span className="self-center text-xs text-warning-600">Pay to confirm</span>
                        )}
                        {isAdmin && CANCELLABLE.includes(a.status) && (
                          <Button size="sm" variant="danger" onClick={() => setCancelTarget(a)}>
                            <Ban className="h-3.5 w-3.5" /> Cancel
                          </Button>
                        )}
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <Pagination page={page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
          </>
        )}
      </Card>

      {canBookOrCheckIn && (
        <BookAppointmentDialog open={bookOpen} onOpenChange={setBookOpen} onBooked={() => { setBookOpen(false); reload() }} />
      )}

      {canBill && billingAppointment && (
        <CreateBillDialog
          open={!!billingAppointment}
          onOpenChange={(open) => { if (!open) { setBillingAppointment(null); setBillingPatient(null) } }}
          defaultPatient={billingPatient}
          defaultAppointment={billingAppointment}
        />
      )}

      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={(o) => !o && setCancelTarget(null)}
        title={`Cancel appointment ${cancelTarget?.appointmentCode ?? ''}?`}
        description="The patient's slot (if any) will be freed up for other bookings."
        confirmLabel="Cancel appointment"
        destructive
        onConfirm={handleCancel}
        loading={cancelling}
      />
    </div>
  )
}