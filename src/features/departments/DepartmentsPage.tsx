import { useState } from 'react'
import { Plus, Building2 } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/Card'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Pagination } from '@/components/common/Pagination'
import { usePaginated } from '@/hooks/usePaginated'
import { departmentsApi } from '@/lib/services/departments'
import { apiErrorMessage } from '@/lib/api-client'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/AuthContext'

export default function DepartmentsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const { session } = useAuth()
  const isAdmin = session?.role === 'HOSPITAL_ADMIN'
  // This whole route is already gated to HOSPITAL_ADMIN in App.tsx (RequireRole) -
  // the isAdmin checks below are defense-in-depth in case that ever changes.

  const { data, loading, page, setPage, reload } = usePaginated(
    (page, size) => departmentsApi.list({ page, size }),
    [],
  )

  async function handleCreate() {
    if (!name.trim()) { toast.error('Department name is required'); return }
    setSaving(true)
    try {
      await departmentsApi.create({ name: name.trim(), description: description.trim() || undefined })
      toast.success('Department created')
      setCreateOpen(false)
      setName(''); setDescription('')
      reload()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Departments"
        description="Clinical departments doctors and staff are organized under."
        actions={isAdmin ? <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> New department</Button> : undefined}
      />

      <Card>
        {loading ? <PageSpinner /> : !data || data.content.length === 0 ? (
          <EmptyState icon={<Building2 className="h-10 w-10" />} title="No departments yet"
            description="Create departments like Cardiology, Orthopedics, or General Medicine to start onboarding doctors."
            action={isAdmin ? <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> New department</Button> : undefined}
          />
        ) : (
          <>
            <Table>
              <THead><TR><TH>Name</TH><TH>Description</TH><TH>Status</TH></TR></THead>
              <TBody>
                {data.content.map(d => (
                  <TR key={d.id}>
                    <TD className="font-medium text-ink-900">{d.name}</TD>
                    <TD className="text-ink-500 max-w-md truncate">{d.description || '—'}</TD>
                    <TD><Badge variant={d.active ? 'success' : 'neutral'}>{d.active ? 'Active' : 'Inactive'}</Badge></TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <Pagination page={page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
          </>
        )}
      </Card>

      {isAdmin && (
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent title="New department">
            <div className="space-y-3">
              <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cardiology" /></div>
              <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} loading={saving}>Create</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}