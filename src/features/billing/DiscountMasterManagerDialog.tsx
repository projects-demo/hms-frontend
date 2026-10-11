import { useEffect, useState } from 'react'
import { Pencil, Plus } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { PageSpinner } from '@/components/ui/Spinner'
import { billingApi } from '@/lib/services/billing'
import type { DiscountMaster } from '@/types/domain'
import { apiErrorMessage } from '@/lib/api-client'
import { toast } from 'sonner'

export function DiscountMasterManagerDialog({ open, onOpenChange }: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [discounts, setDiscounts] = useState<DiscountMaster[]>([])
  const [editing, setEditing] = useState<DiscountMaster | null>(null)
  const [name, setName] = useState('')
  const [percentage, setPercentage] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      setDiscounts(await billingApi.discounts.list())
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (open) void load() }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  function reset() {
    setEditing(null)
    setName('')
    setPercentage('')
  }

  async function save() {
    const rate = Number(percentage)
    if (!name.trim() || !Number.isFinite(rate) || rate <= 0 || rate > 100) {
      toast.error('Enter a name and a percentage greater than 0 and no more than 100')
      return
    }
    setSaving(true)
    try {
      const payload = { name: name.trim(), percentage: rate }
      if (editing) await billingApi.discounts.update(editing.id, payload)
      else await billingApi.discounts.create(payload)
      toast.success(editing ? 'Discount updated' : 'Discount configured')
      reset()
      await load()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  function edit(discount: DiscountMaster) {
    setEditing(discount)
    setName(discount.name)
    setPercentage(String(discount.percentage))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Discount percentages" description="Configure discounts that a hospital admin may apply when finalizing a bill." className="max-w-xl">
        <div className="space-y-5">
          <section>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Configured discounts</p>
              <Button size="sm" variant="outline" onClick={reset}><Plus className="h-3.5 w-3.5" /> Add discount</Button>
            </div>
            {loading ? <PageSpinner /> : discounts.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-4 text-sm text-ink-500">No percentage discounts configured.</p>
            ) : (
              <div className="max-h-48 overflow-auto rounded-lg border border-border">
                <Table>
                  <THead><TR><TH>Name</TH><TH>Percentage</TH><TH></TH></TR></THead>
                  <TBody>
                    {discounts.map(discount => (
                      <TR key={discount.id}>
                        <TD className="font-medium">{discount.name}</TD>
                        <TD>{discount.percentage}%</TD>
                        <TD className="text-right"><Button size="sm" variant="outline" onClick={() => edit(discount)}><Pencil className="h-3.5 w-3.5" /> Edit</Button></TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
            )}
          </section>

          <section className="space-y-3 rounded-lg border border-border p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{editing ? 'Edit discount' : 'Add discount'}</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Discount name *</Label><Input value={name} onChange={event => setName(event.target.value)} placeholder="Senior citizen" /></div>
              <div><Label>Percentage *</Label><Input type="number" min={0.01} max={100} step="0.01" value={percentage} onChange={event => setPercentage(event.target.value)} placeholder="10" /></div>
            </div>
            <div className="flex justify-end gap-2">
              {editing && <Button variant="outline" onClick={reset}>Cancel edit</Button>}
              <Button onClick={save} loading={saving}>{editing ? 'Save discount' : 'Add discount'}</Button>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}