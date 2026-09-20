import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'

export function ConfirmDialog({
  open, onOpenChange, title, description, confirmLabel = 'Confirm', destructive, onConfirm, loading,
}: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string
  confirmLabel?: string; destructive?: boolean; onConfirm: () => void; loading?: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={title} description={description}>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
