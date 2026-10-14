import { useState } from 'react'
import { Plus, Building2, Pencil } from 'lucide-react'
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
import { FieldError } from '@/components/common/FieldError'
import type { Department } from '@/types/domain'

export default function DepartmentsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [nameError, setNameError] = useState('')

  const { session } = useAuth()
  const isAdmin = session?.role === 'HOSPITAL_ADMIN'
  // This whole route is already gated to HOSPITAL_ADMIN in App.tsx (RequireRole) -
  // the isAdmin checks below are defense-in-depth in case that ever changes.

  const { data, loading, page, setPage, reload } = usePaginated(
    (page, size) => departmentsApi.list({ page, size }),
    [],
  )

  function openCreate() {
    setEditingDepartment(null)
    setName('')
    setDescription('')
    setNameError('')
    setCreateOpen(true)
  }

  function openEdit(department: Department) {
    setEditingDepartment(department)
    setName(department.name)
    setDescription(department.description ?? '')
    setNameError('')
    setCreateOpen(true)
  }

  async function handleSave() {
    if (!name.trim()) { setNameError('Department name is required.'); toast.error('Please correct the highlighted field'); return }
    if (name.trim().length > 100) { setNameError('Department name must be 100 characters or fewer.'); return }
    setSaving(true)
    try {
      const payload = { name: name.trim(), description: description.trim() || undefined }
      if (editingDepartment) await departmentsApi.update(editingDepartment.id, payload)
      else await departmentsApi.create(payload)
      toast.success(editingDepartment ? 'Department updated' : 'Department created')
      setCreateOpen(false)
      setEditingDepartment(null)
      setName(''); setDescription(''); setNameError('')
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
        actions={isAdmin ? <Button onClick={openCreate}><Plus className="h-4 w-4" /> New department</Button> : undefined}
      />

      <Card>
        {loading ? <PageSpinner /> : !data || data.content.length === 0 ? (
          <EmptyState icon={<Building2 className="h-10 w-10" />} title="No departments yet"
            description="Create departments like Cardiology, Orthopedics, or General Medicine to start onboarding doctors."
            action={isAdmin ? <Button onClick={openCreate}><Plus className="h-4 w-4" /> New department</Button> : undefined}
          />
        ) : (
          <>
            <Table>
              <THead><TR><TH>Name</TH><TH>Description</TH><TH>Status</TH>{isAdmin && <TH className="text-right">Actions</TH>}</TR></THead>
              <TBody>
                {data.content.map(d => (
                  <TR key={d.id}>
                    <TD className="font-medium text-ink-900">{d.name}</TD>
                    <TD className="text-ink-500 max-w-md truncate">{d.description || '—'}</TD>
                    <TD><Badge variant={d.active ? 'success' : 'neutral'}>{d.active ? 'Active' : 'Inactive'}</Badge></TD>
                    {isAdmin && <TD className="text-right"><Button size="sm" variant="outline" onClick={() => openEdit(d)}><Pencil className="h-3.5 w-3.5" /> Edit</Button></TD>}
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
          <DialogContent title={editingDepartment ? 'Edit department' : 'New department'}>
            <div className="space-y-3">
              <div><Label>Name *</Label><Input required maxLength={100} aria-invalid={!!nameError} error={!!nameError} value={name} onChange={(e) => { setName(e.target.value); setNameError('') }} placeholder="e.g. Cardiology" /><FieldError message={nameError} /></div>
              <div><Label>Description</Label><Textarea maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" onClick={() => { setCreateOpen(false); setEditingDepartment(null) }}>Cancel</Button>
                <Button onClick={handleSave} loading={saving}>{editingDepartment ? 'Save changes' : 'Create'}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}