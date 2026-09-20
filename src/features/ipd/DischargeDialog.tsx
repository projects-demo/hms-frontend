import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { ipdApi } from '@/lib/services/ipd'
import type { Admission } from '@/types/domain'
import { apiErrorMessage } from '@/lib/api-client'
import { toast } from 'sonner'

export function DischargeDialog({ open, onOpenChange, admission, onDischarged }: {
  open: boolean; onOpenChange: (o: boolean) => void; admission: Admission | null; onDischarged: () => void
}) {
  const [finalDiagnosis, setFinalDiagnosis] = useState('')
  const [summary, setSummary] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!admission || !finalDiagnosis.trim() || !summary.trim()) { toast.error('Final diagnosis and discharge summary are required'); return }
    setSaving(true)
    try {
      await ipdApi.discharge(admission.id, { finalDiagnosis, dischargeSummary: summary })
      toast.success('Patient discharged')
      setFinalDiagnosis(''); setSummary('')
      onDischarged()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={`Discharge — ${admission?.admissionCode ?? ''}`}>
        <div className="space-y-3">
          <div><Label>Final diagnosis *</Label><Textarea value={finalDiagnosis} onChange={(e) => setFinalDiagnosis(e.target.value)} rows={2} /></div>
          <div><Label>Discharge summary *</Label><Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} /></div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>Confirm discharge</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
