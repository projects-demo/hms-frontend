import { useState } from 'react'
import { Plus, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/common/PageHeader'
import { SearchInput } from '@/components/common/SearchInput'
import { Pagination } from '@/components/common/Pagination'
import { Card } from '@/components/ui/Card'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { usePaginated } from '@/hooks/usePaginated'
import { useDebounce } from '@/hooks/useDebounce'
import { patientsApi } from '@/lib/services/patients'
import { formatDate } from '@/lib/utils'
import { PatientFormDialog } from './PatientFormDialog'

export default function PatientsPage() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query)
  const [createOpen, setCreateOpen] = useState(false)
  const navigate = useNavigate()

  const { data, loading, page, setPage, reload } = usePaginated(
    (page, size) => patientsApi.search({ q: debouncedQuery || undefined, page, size }),
    [debouncedQuery],
  )

  return (
    <div>
      <PageHeader
        title="Patients"
        description="Register and search patient records."
        actions={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Register patient</Button>}
      />

      <Card>
        <div className="p-4 border-b border-border">
          <SearchInput value={query} onChange={setQuery} placeholder="Search by name, phone or patient code..." className="max-w-sm" />
        </div>

        {loading ? (
          <PageSpinner />
        ) : !data || data.content.length === 0 ? (
          <EmptyState
            icon={<Users className="h-10 w-10" />}
            title={query ? 'No patients match your search' : 'No patients registered yet'}
            description={query ? 'Try a different name, phone number, or patient code.' : 'Register your first patient to get started.'}
            action={!query && <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Register patient</Button>}
          />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>Patient</TH>
                  <TH>Code</TH>
                  <TH>Gender / Age</TH>
                  <TH>Phone</TH>
                  <TH>City</TH>
                  <TH>Registered</TH>
                </TR>
              </THead>
              <TBody>
                {data.content.map((p) => (
                  <TR key={p.id} className="cursor-pointer" onClick={() => navigate(`/patients/${p.id}`)}>
                    <TD className="font-medium text-ink-900">{p.firstName} {p.lastName}</TD>
                    <TD className="font-mono text-xs">{p.patientCode}</TD>
                    <TD><Badge variant="neutral">{p.gender}</Badge> <span className="text-ink-500">{p.age ?? '—'}y</span></TD>
                    <TD>{p.primaryPhone}</TD>
                    <TD>{p.city || '—'}</TD>
                    <TD className="text-ink-500">{formatDate(p.createdAt)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <Pagination page={page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
          </>
        )}
      </Card>

      <PatientFormDialog open={createOpen} onOpenChange={setCreateOpen} onSaved={() => { setCreateOpen(false); reload() }} />
    </div>
  )
}
