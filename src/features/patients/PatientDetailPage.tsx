import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Pencil, Phone, Mail, MapPin, Shield, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { EmptyState } from '@/components/ui/EmptyState'
import { patientsApi } from '@/lib/services/patients'
import { appointmentsApi } from '@/lib/services/appointments'
import { opdApi } from '@/lib/services/opd'
import { ipdApi } from '@/lib/services/ipd'
import { billingApi } from '@/lib/services/billing'
import type { Patient, Appointment, Consultation, Admission, Bill } from '@/types/domain'
import { formatDate, formatDateTime, formatCurrency, initials } from '@/lib/utils'
import { apiErrorMessage } from '@/lib/api-client'
import { toast } from 'sonner'
import { PatientFormDialog } from './PatientFormDialog'
import { useAuth } from '@/features/auth/AuthContext'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const patientId = Number(id)
  const navigate = useNavigate()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { session } = useAuth()
  const isAdmin = session?.role === 'HOSPITAL_ADMIN'
  const [tab, setTab] = useState('appointments')

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [admissions, setAdmissions] = useState<Admission[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [tabLoading, setTabLoading] = useState(false)

  function loadPatient() {
    setLoading(true)
    patientsApi.get(patientId).then(setPatient).catch((err) => toast.error(apiErrorMessage(err))).finally(() => setLoading(false))
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await patientsApi.remove(patientId)
      toast.success('Patient record deleted')
      navigate('/patients')
    } catch (err) {
      toast.error(apiErrorMessage(err))
      setDeleting(false)
    }
  }

  useEffect(() => { loadPatient() }, [patientId])

  useEffect(() => {
    setTabLoading(true)
    const done = () => setTabLoading(false)
    if (tab === 'appointments') appointmentsApi.search({ patientId, size: 20 }).then(r => setAppointments(r.content)).catch(() => {}).finally(done)
    else if (tab === 'consultations') opdApi.byPatient(patientId, { size: 20 }).then(r => setConsultations(r.content)).catch(() => {}).finally(done)
    else if (tab === 'admissions') ipdApi.search({ patientId, size: 20 }).then(r => setAdmissions(r.content)).catch(() => {}).finally(done)
    else if (tab === 'bills') billingApi.bills.search({ patientId, size: 20 }).then(r => setBills(r.content)).catch(() => {}).finally(done)
  }, [tab, patientId])

  if (loading) return <PageSpinner />
  if (!patient) return <EmptyState title="Patient not found" />

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate('/patients')}>
        <ArrowLeft className="h-4 w-4" /> Back to patients
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-1 h-fit">
          <CardContent className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xl font-semibold">
              {initials(`${patient.firstName} ${patient.lastName}`)}
            </div>
            <h2 className="mt-3 text-lg font-semibold text-ink-900">{patient.firstName} {patient.lastName}</h2>
            <p className="text-xs font-mono text-ink-500">{patient.patientCode}</p>
            <div className="flex justify-center gap-2 mt-2">
              <Badge variant="neutral">{patient.gender}</Badge>
              {patient.age != null && <Badge variant="neutral">{patient.age} yrs</Badge>}
            </div>
            <Button size="sm" variant="outline" className="mt-4 w-full" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5" /> Edit details
            </Button>
            {isAdmin && (
              <Button size="sm" variant="danger" className="mt-2 w-full" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-3.5 w-3.5" /> Delete patient
              </Button>
            )}

            <div className="mt-5 pt-5 border-t border-border text-left space-y-3">
              <div className="flex items-start gap-2.5 text-sm">
                <Phone className="h-4 w-4 text-ink-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-ink-900">{patient.primaryPhone}</p>
                  {patient.secondaryPhone && <p className="text-ink-500 text-xs">{patient.secondaryPhone}</p>}
                </div>
              </div>
              {patient.email && (
                <div className="flex items-start gap-2.5 text-sm">
                  <Mail className="h-4 w-4 text-ink-400 mt-0.5 shrink-0" />
                  <p className="text-ink-900 break-all">{patient.email}</p>
                </div>
              )}
              {(patient.city || patient.street) && (
                <div className="flex items-start gap-2.5 text-sm">
                  <MapPin className="h-4 w-4 text-ink-400 mt-0.5 shrink-0" />
                  <p className="text-ink-900">{[patient.street, patient.city, patient.state, patient.zipCode].filter(Boolean).join(', ')}</p>
                </div>
              )}
              {patient.insuranceProvider && (
                <div className="flex items-start gap-2.5 text-sm">
                  <Shield className="h-4 w-4 text-ink-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-ink-900">{patient.insuranceProvider}</p>
                    {patient.policyNumber && <p className="text-ink-500 text-xs">Policy: {patient.policyNumber}</p>}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
              <TabsTrigger value="consultations">Consultations</TabsTrigger>
              <TabsTrigger value="admissions">Admissions</TabsTrigger>
              <TabsTrigger value="bills">Bills</TabsTrigger>
            </TabsList>

            <TabsContent value="appointments">
              <Card>
                {tabLoading ? <PageSpinner /> : appointments.length === 0 ? (
                  <EmptyState title="No appointments yet" />
                ) : (
                  <Table>
                    <THead><TR><TH>Code</TH><TH>Date</TH><TH>Type</TH><TH>Status</TH><TH>Fee</TH></TR></THead>
                    <TBody>
                      {appointments.map(a => (
                        <TR key={a.id}>
                          <TD className="font-mono text-xs">{a.appointmentCode}</TD>
                          <TD>{formatDate(a.appointmentDate)}</TD>
                          <TD>{a.appointmentType}</TD>
                          <TD><StatusBadge status={a.status} /></TD>
                          <TD>{a.freeVisit ? 'Free' : formatCurrency(a.feeAmount)}</TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="consultations">
              <Card>
                {tabLoading ? <PageSpinner /> : consultations.length === 0 ? (
                  <EmptyState title="No consultations yet" />
                ) : (
                  <Table>
                    <THead><TR><TH>Date</TH><TH>Chief complaint</TH><TH>Diagnosis</TH><TH>Status</TH></TR></THead>
                    <TBody>
                      {consultations.map(c => (
                        <TR key={c.id}>
                          <TD>{formatDateTime(c.startedAt)}</TD>
                          <TD className="max-w-[200px] truncate">{c.chiefComplaint || '—'}</TD>
                          <TD className="max-w-[200px] truncate">{c.diagnosis || '—'}</TD>
                          <TD><StatusBadge status={c.status} /></TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="admissions">
              <Card>
                {tabLoading ? <PageSpinner /> : admissions.length === 0 ? (
                  <EmptyState title="No admissions yet" />
                ) : (
                  <Table>
                    <THead><TR><TH>Code</TH><TH>Bed</TH><TH>Admitted</TH><TH>Discharged</TH><TH>Status</TH></TR></THead>
                    <TBody>
                      {admissions.map(a => (
                        <TR key={a.id}>
                          <TD className="font-mono text-xs">{a.admissionCode}</TD>
                          <TD>{a.bedNumber}</TD>
                          <TD>{formatDateTime(a.admissionDate)}</TD>
                          <TD>{a.dischargeDate ? formatDateTime(a.dischargeDate) : '—'}</TD>
                          <TD><StatusBadge status={a.status} /></TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="bills">
              <Card>
                {tabLoading ? <PageSpinner /> : bills.length === 0 ? (
                  <EmptyState title="No bills yet" />
                ) : (
                  <Table>
                    <THead><TR><TH>Bill #</TH><TH>Type</TH><TH>Total</TH><TH>Balance</TH><TH>Status</TH></TR></THead>
                    <TBody>
                      {bills.map(b => (
                        <TR key={b.id} className="cursor-pointer" onClick={() => navigate(`/billing/${b.id}`)}>
                          <TD className="font-mono text-xs">{b.billNumber}</TD>
                          <TD>{b.billType}</TD>
                          <TD>{formatCurrency(b.totalAmount)}</TD>
                          <TD className={b.balanceAmount > 0 ? 'text-danger-600 font-medium' : ''}>{formatCurrency(b.balanceAmount)}</TD>
                          <TD><StatusBadge status={b.status} /></TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <PatientFormDialog open={editOpen} onOpenChange={setEditOpen} patient={patient} onSaved={() => { setEditOpen(false); loadPatient() }} />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${patient.firstName} ${patient.lastName}?`}
        description="This permanently removes the patient record. This cannot be undone - consider whether you actually want this instead of just editing their details."
        confirmLabel="Delete permanently"
        destructive
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}