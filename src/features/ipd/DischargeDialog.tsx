import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { ipdApi } from '@/lib/services/ipd'
import type { Admission } from '@/types/domain'
import { apiErrorMessage } from '@/lib/api-client'
import { toast } from 'sonner'
import { FieldError } from '@/components/common/FieldError'

export function DischargeDialog({ open, onOpenChange, admission, onDischarged }: {
  open: boolean; onOpenChange: (o: boolean) => void; admission: Admission | null; onDischarged: () => void
}) {
  const [finalDiagnosis, setFinalDiagnosis] = useState('')
  const [summary, setSummary] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({ finalDiagnosis: '', summary: '' })

  async function handleSubmit() {
    const nextErrors = {
      finalDiagnosis: finalDiagnosis.trim() ? '' : 'Final diagnosis is required.',
      summary: summary.trim() ? '' : 'Discharge summary is required.',
    }
    setErrors(nextErrors)
    if (!admission || Object.values(nextErrors).some(Boolean)) { toast.error('Please correct the highlighted fields'); return }
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
          <div><Label>Final diagnosis *</Label><Textarea required maxLength={2000} aria-invalid={!!errors.finalDiagnosis} className={errors.finalDiagnosis ? 'border-danger-500' : undefined} value={finalDiagnosis} onChange={(e) => { setFinalDiagnosis(e.target.value); setErrors(current => ({ ...current, finalDiagnosis: '' })) }} rows={2} /><FieldError message={errors.finalDiagnosis} /></div>
          <div><Label>Discharge summary *</Label><Textarea required maxLength={5000} aria-invalid={!!errors.summary} className={errors.summary ? 'border-danger-500' : undefined} value={summary} onChange={(e) => { setSummary(e.target.value); setErrors(current => ({ ...current, summary: '' })) }} rows={4} /><FieldError message={errors.summary} /></div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>Confirm discharge</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
