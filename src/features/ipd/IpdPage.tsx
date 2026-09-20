import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, BedDouble } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination } from '@/components/common/Pagination'
import { Card } from '@/components/ui/Card'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select, SelectItem } from '@/components/ui/Select'
import { usePaginated } from '@/hooks/usePaginated'
import { ipdApi } from '@/lib/services/ipd'
import type { Admission, AdmissionStatus } from '@/types/domain'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import { apiErrorMessage } from '@/lib/api-client'
import { toast } from 'sonner'
import { AdmitPatientDialog } from './AdmitPatientDialog'
import { DischargeDialog } from './DischargeDialog'
import { useAuth } from '@/features/auth/AuthContext'
import { ROLE_GROUPS, hasRole } from '@/lib/permissions'

export default function IpdPage() {
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState(searchParams.get('tab') ?? 'admissions')
  return (
    <div>
      <PageHeader title="IPD / Admissions" description="Wards, beds and inpatient admissions." />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="admissions">Admissions</TabsTrigger>
          <TabsTrigger value="wards">Wards &amp; Beds</TabsTrigger>
        </TabsList>
        <TabsContent value="admissions"><AdmissionsTab /></TabsContent>
        <TabsContent value="wards"><WardsTab /></TabsContent>
      </Tabs>
    </div>
  )
}

function AdmissionsTab() {
  const [searchParams] = useSearchParams()
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') ?? 'ADMITTED')
  const [admitOpen, setAdmitOpen] = useState(false)
  const [dischargeTarget, setDischargeTarget] = useState<Admission | null>(null)

  const { session } = useAuth()
  const canAdmit = hasRole(session?.role, ROLE_GROUPS.IPD_ADMIT)
  const canDischarge = hasRole(session?.role, ROLE_GROUPS.IPD_DISCHARGE)

  const { data, loading, page, setPage, reload } = usePaginated(
    (page, size) => ipdApi.search({ status: statusFilter === 'ALL' ? undefined : (statusFilter as AdmissionStatus), page, size }),
    [statusFilter],
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <Select value={statusFilter} onValueChange={setStatusFilter} className="w-48">
          <SelectItem value="ALL">All statuses</SelectItem>
          <SelectItem value="ADMITTED">Currently admitted</SelectItem>
          <SelectItem value="DISCHARGED">Discharged</SelectItem>
          <SelectItem value="TRANSFERRED">Transferred</SelectItem>
        </Select>
        {canAdmit && <Button onClick={() => setAdmitOpen(true)}><Plus className="h-4 w-4" /> Admit patient</Button>}
      </div>

      <Card>
        {loading ? <PageSpinner /> : !data || data.content.length === 0 ? (
          <EmptyState icon={<BedDouble className="h-10 w-10" />} title="No admissions found" />
        ) : (
          <>
            <Table>
              <THead><TR><TH>Code</TH><TH>Bed</TH><TH>Type</TH><TH>Admitted</TH><TH>Status</TH><TH></TH></TR></THead>
              <TBody>
                {data.content.map(a => (
                  <TR key={a.id}>
                    <TD className="font-mono text-xs">{a.admissionCode}</TD>
                    <TD>{a.bedNumber}</TD>
                    <TD>{a.admissionType}</TD>
                    <TD>{formatDateTime(a.admissionDate)}</TD>
                    <TD><StatusBadge status={a.status} /></TD>
                    <TD className="text-right">
                      {a.status === 'ADMITTED' && canDischarge && (
                        <Button size="sm" variant="outline" onClick={() => setDischargeTarget(a)}>Discharge</Button>
                      )}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <Pagination page={page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
          </>
        )}
      </Card>

      {canAdmit && (
        <AdmitPatientDialog open={admitOpen} onOpenChange={setAdmitOpen} onAdmitted={() => { setAdmitOpen(false); reload() }} />
      )}
      {canDischarge && (
        <DischargeDialog
          open={!!dischargeTarget}
          onOpenChange={(o) => !o && setDischargeTarget(null)}
          admission={dischargeTarget}
          onDischarged={() => { setDischargeTarget(null); reload() }}
        />
      )}
    </div>
  )
}

function WardsTab() {
  const [wardOpen, setWardOpen] = useState(false)
  const [bedOpen, setBedOpen] = useState(false)
  const [wardName, setWardName] = useState('')
  const [wardType, setWardType] = useState('GENERAL')
  const [floor, setFloor] = useState('')
  const [bedWardId, setBedWardId] = useState('')
  const [bedNumber, setBedNumber] = useState('')
  const [dailyRate, setDailyRate] = useState('')
  const [saving, setSaving] = useState(false)

  const { session } = useAuth()
  const isAdmin = session?.role === 'HOSPITAL_ADMIN'

  const { data: wards, loading: loadingWards, reload: reloadWards } = usePaginated((page, size) => ipdApi.listWards({ page, size }), [], 50)
  const { data: beds, loading: loadingBeds, reload: reloadBeds } = usePaginated((page, size) => ipdApi.listBeds({ page, size }), [], 50)

  async function createWard() {
    if (!wardName.trim()) { toast.error('Ward name is required'); return }
    setSaving(true)
    try {
      await ipdApi.createWard({ name: wardName, wardType, floor: floor || undefined })
      toast.success('Ward created')
      setWardOpen(false); setWardName(''); setFloor('')
      reloadWards()
    } catch (err) { toast.error(apiErrorMessage(err)) } finally { setSaving(false) }
  }

  async function createBed() {
    if (!bedWardId || !bedNumber.trim()) { toast.error('Ward and bed number are required'); return }
    setSaving(true)
    try {
      await ipdApi.createBed({ wardId: Number(bedWardId), bedNumber, dailyRate: Number(dailyRate) || 0 })
      toast.success('Bed added')
      setBedOpen(false); setBedNumber(''); setDailyRate('')
      reloadBeds()
    } catch (err) { toast.error(apiErrorMessage(err)) } finally { setSaving(false) }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <Card>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold">Wards</h3>
          {isAdmin && <Button size="sm" onClick={() => setWardOpen(true)}><Plus className="h-3.5 w-3.5" /> Add ward</Button>}
        </div>
        {loadingWards ? <PageSpinner /> : !wards || wards.content.length === 0 ? (
          <EmptyState title="No wards yet" />
        ) : (
          <Table>
            <THead><TR><TH>Name</TH><TH>Type</TH><TH>Beds</TH></TR></THead>
            <TBody>
              {wards.content.map(w => (
                <TR key={w.id}><TD className="font-medium">{w.name}</TD><TD><Badge variant="neutral">{w.wardType}</Badge></TD><TD>{w.totalBeds}</TD></TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Card>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold">Beds</h3>
          {isAdmin && <Button size="sm" onClick={() => setBedOpen(true)}><Plus className="h-3.5 w-3.5" /> Add bed</Button>}
        </div>
        {loadingBeds ? <PageSpinner /> : !beds || beds.content.length === 0 ? (
          <EmptyState title="No beds yet" />
        ) : (
          <Table>
            <THead><TR><TH>Ward</TH><TH>Bed #</TH><TH>Rate/day</TH><TH>Status</TH></TR></THead>
            <TBody>
              {beds.content.map(b => (
                <TR key={b.id}><TD>{b.wardName}</TD><TD className="font-medium">{b.bedNumber}</TD><TD>{formatCurrency(b.dailyRate)}</TD><TD><StatusBadge status={b.status} /></TD></TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      {isAdmin && (
        <>
          <Dialog open={wardOpen} onOpenChange={setWardOpen}>
            <DialogContent title="Add ward">
              <div className="space-y-3">
                <div><Label>Name *</Label><Input value={wardName} onChange={(e) => setWardName(e.target.value)} placeholder="e.g. ICU Ward" /></div>
                <div>
                  <Label>Type</Label>
                  <Select value={wardType} onValueChange={setWardType}>
                    <SelectItem value="GENERAL">General</SelectItem>
                    <SelectItem value="ICU">ICU</SelectItem>
                    <SelectItem value="PRIVATE">Private</SelectItem>
                    <SelectItem value="SEMI_PRIVATE">Semi-private</SelectItem>
                    <SelectItem value="EMERGENCY">Emergency</SelectItem>
                  </Select>
                </div>
                <div><Label>Floor</Label><Input value={floor} onChange={(e) => setFloor(e.target.value)} /></div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="outline" onClick={() => setWardOpen(false)}>Cancel</Button>
                  <Button onClick={createWard} loading={saving}>Create</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={bedOpen} onOpenChange={setBedOpen}>
            <DialogContent title="Add bed">
              <div className="space-y-3">
                <div>
                  <Label>Ward *</Label>
                  <Select value={bedWardId} onValueChange={setBedWardId} placeholder="Select ward">
                    {(wards?.content ?? []).map(w => <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>)}
                  </Select>
                </div>
                <div><Label>Bed number *</Label><Input value={bedNumber} onChange={(e) => setBedNumber(e.target.value)} placeholder="e.g. B-101" /></div>
                <div><Label>Daily rate (₹)</Label><Input type="number" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} /></div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="outline" onClick={() => setBedOpen(false)}>Cancel</Button>
                  <Button onClick={createBed} loading={saving}>Add bed</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}