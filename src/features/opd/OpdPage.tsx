import { useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/Card'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { usePaginated } from '@/hooks/usePaginated'
import { appointmentsApi } from '@/lib/services/appointments'
import type { Appointment } from '@/types/domain'
import { formatCurrency } from '@/lib/utils'
import { ConsultationDialog } from './ConsultationDialog'
import { useAuth } from '@/features/auth/AuthContext'
import { ROLE_GROUPS, hasRole } from '@/lib/permissions'

/** Today's OPD queue: appointments checked in and ready to be seen, or already in progress. */
export default function OpdPage() {
  const today = new Date().toISOString().slice(0, 10)
  const [active, setActive] = useState<Appointment | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { session } = useAuth()
  // Backend only allows DOCTOR/NURSE to actually start a consultation - ADMIN can
  // see the queue (route is gated to CLINICAL: ADMIN+DOCTOR+NURSE) but not action it.
  const canStartConsultation = hasRole(session?.role, ROLE_GROUPS.DOCTOR_NURSE)

  const { data, loading, page, setPage, reload } = usePaginated(
    (page, size) => appointmentsApi.search({ date: today, status: 'CHECKED_IN', page, size }),
    [],
    20,
  )

  function openConsultation(appt: Appointment) {
    setActive(appt)
    setDialogOpen(true)
  }

  return (
    <div>
      <PageHeader title="OPD Queue" description={`Patients checked in today, ready for consultation.`} />

      <Card>
        {loading ? <PageSpinner /> : !data || data.content.length === 0 ? (
          <EmptyState icon={<ClipboardList className="h-10 w-10" />} title="No one waiting"
            description="Patients appear here once they're checked in from the Appointments page." />
        ) : (
          <Table>
            <THead><TR><TH>Code</TH><TH>Type</TH><TH>Fee</TH><TH>Status</TH><TH></TH></TR></THead>
            <TBody>
              {data.content.map(a => (
                <TR key={a.id}>
                  <TD className="font-mono text-xs">{a.appointmentCode}</TD>
                  <TD>{a.appointmentType}</TD>
                  <TD>{a.freeVisit ? 'Free' : formatCurrency(a.feeAmount)}</TD>
                  <TD><StatusBadge status={a.status} /></TD>
                  <TD className="text-right">
                    {canStartConsultation && <Button size="sm" onClick={() => openConsultation(a)}>Start consultation</Button>}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      {canStartConsultation && (
        <ConsultationDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          appointment={active}
          onDone={() => { setDialogOpen(false); reload() }}
        />
      )}
    </div>
  )
}