import { useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Plus, Pill, AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { SearchInput } from '@/components/common/SearchInput'
import { Pagination } from '@/components/common/Pagination'
import { Card } from '@/components/ui/Card'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { AsyncCombobox } from '@/components/common/AsyncCombobox'
import { usePaginated } from '@/hooks/usePaginated'
import { useDebounce } from '@/hooks/useDebounce'
import { pharmacyApi } from '@/lib/services/pharmacy'
import type { DrugBatch } from '@/types/domain'
import type { OptionDto as Opt } from '@/types/api'
import { formatDate } from '@/lib/utils'
import { apiErrorMessage } from '@/lib/api-client'
import { toast } from 'sonner'
import { DispenseDialog } from './DispenseDialog'
import { FieldError } from '@/components/common/FieldError'

export default function PharmacyPage() {
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState(searchParams.get('tab') ?? 'drugs')
  const [dispenseOpen, setDispenseOpen] = useState(false)

  return (
    <div>
      <PageHeader
        title="Pharmacy"
        description="Drug catalog, stock batches and dispensing."
        actions={<Button onClick={() => setDispenseOpen(true)}><Plus className="h-4 w-4" /> Dispense</Button>}
      />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="drugs">Drug catalog</TabsTrigger>
          <TabsTrigger value="alerts">Low stock &amp; expiring</TabsTrigger>
        </TabsList>
        <TabsContent value="drugs"><DrugsTab /></TabsContent>
        <TabsContent value="alerts"><AlertsTab /></TabsContent>
      </Tabs>

      <DispenseDialog open={dispenseOpen} onOpenChange={setDispenseOpen} onDispensed={() => setDispenseOpen(false)} />
    </div>
  )
}

function DrugsTab() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query)
  const [createOpen, setCreateOpen] = useState(false)
  const [batchOpen, setBatchOpen] = useState(false)

  const [name, setName] = useState('')
  const [genericName, setGenericName] = useState('')
  const [manufacturer, setManufacturer] = useState('')
  const [category, setCategory] = useState('')
  const [reorderLevel, setReorderLevel] = useState('10')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [batchDrug, setBatchDrug] = useState<Opt | null>(null)
  const [batchNumber, setBatchNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [quantity, setQuantity] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [sellingPrice, setSellingPrice] = useState('')

  const { data, loading, page, setPage, reload } = usePaginated(
    (page, size) => pharmacyApi.drugs.search({ q: debouncedQuery || undefined, page, size }),
    [debouncedQuery],
  )

  async function createDrug() {
    const reorder = Number(reorderLevel)
    const nextErrors = {
      name: name.trim() ? '' : 'Drug name is required.',
      reorderLevel: Number.isInteger(reorder) && reorder >= 0 ? '' : 'Reorder level must be a non-negative whole number.',
    }
    setErrors(current => ({ ...current, ...nextErrors }))
    if (Object.values(nextErrors).some(Boolean)) { toast.error('Please correct the highlighted fields'); return }
    setSaving(true)
    try {
      await pharmacyApi.drugs.create({ name, genericName: genericName || undefined, manufacturer: manufacturer || undefined, category: category || undefined, reorderLevel: Number(reorderLevel) })
      toast.success('Drug added to catalog')
      setCreateOpen(false)
      setName(''); setGenericName(''); setManufacturer(''); setCategory(''); setReorderLevel('10'); setErrors({})
      reload()
    } catch (err) { toast.error(apiErrorMessage(err)) } finally { setSaving(false) }
  }

  async function receiveBatch() {
    const quantityValue = Number(quantity)
    const purchaseValue = purchasePrice.trim() ? Number(purchasePrice) : 0
    const sellingValue = sellingPrice.trim() ? Number(sellingPrice) : 0
    const nextErrors = {
      batchDrug: batchDrug ? '' : 'Select a drug.',
      batchNumber: batchNumber.trim() ? '' : 'Batch number is required.',
      expiryDate: expiryDate ? '' : 'Expiry date is required.',
      quantity: Number.isInteger(quantityValue) && quantityValue >= 1 ? '' : 'Quantity must be a whole number of at least 1.',
      purchasePrice: Number.isFinite(purchaseValue) && purchaseValue >= 0 ? '' : 'Purchase price must be non-negative.',
      sellingPrice: Number.isFinite(sellingValue) && sellingValue >= 0 ? '' : 'Selling price must be non-negative.',
    }
    setErrors(current => ({ ...current, ...nextErrors }))
    if (!batchDrug || Object.values(nextErrors).some(Boolean)) { toast.error('Please correct the highlighted fields'); return }
    setSaving(true)
    try {
      await pharmacyApi.drugs.receiveBatch({
        drugId: batchDrug.id, batchNumber, expiryDate, quantity: Number(quantity),
        purchasePrice: purchaseValue, sellingPrice: sellingValue,
      })
      toast.success('Stock batch received')
      setBatchOpen(false)
      setBatchDrug(null); setBatchNumber(''); setExpiryDate(''); setQuantity(''); setPurchasePrice(''); setSellingPrice('')
    } catch (err) { toast.error(apiErrorMessage(err)) } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 gap-2">
        <SearchInput value={query} onChange={setQuery} placeholder="Search drug name..." className="max-w-sm" />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setBatchOpen(true)}>Receive stock</Button>
          <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Add drug</Button>
        </div>
      </div>

      <Card>
        {loading ? <PageSpinner /> : !data || data.content.length === 0 ? (
          <EmptyState icon={<Pill className="h-10 w-10" />} title="No drugs in catalog yet"
            action={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Add drug</Button>} />
        ) : (
          <>
            <Table>
              <THead><TR><TH>Code</TH><TH>Name</TH><TH>Generic</TH><TH>Category</TH><TH>Reorder level</TH></TR></THead>
              <TBody>
                {data.content.map(d => (
                  <TR key={d.id}>
                    <TD className="font-mono text-xs">{d.drugCode}</TD>
                    <TD className="font-medium text-ink-900">{d.name}</TD>
                    <TD className="text-ink-500">{d.genericName || '—'}</TD>
                    <TD>{d.category ? <Badge variant="neutral">{d.category}</Badge> : '—'}</TD>
                    <TD>{d.reorderLevel}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <Pagination page={page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
          </>
        )}
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent title="Add drug to catalog">
          <div className="space-y-3">
            <div><Label>Name *</Label><Input required maxLength={150} aria-invalid={!!errors.name} error={!!errors.name} value={name} onChange={(e) => { setName(e.target.value); setErrors(current => ({ ...current, name: '' })) }} /><FieldError message={errors.name} /></div>
            <div><Label>Generic name</Label><Input maxLength={150} value={genericName} onChange={(e) => setGenericName(e.target.value)} /></div>
            <div><Label>Manufacturer</Label><Input maxLength={150} value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} /></div>
            <div><Label>Category</Label><Input maxLength={100} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Tablet, Syrup, Injection..." /></div>
            <div><Label>Reorder level</Label><Input type="number" min={0} step={1} aria-invalid={!!errors.reorderLevel} error={!!errors.reorderLevel} value={reorderLevel} onChange={(e) => { setReorderLevel(e.target.value); setErrors(current => ({ ...current, reorderLevel: '' })) }} /><FieldError message={errors.reorderLevel} /></div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={createDrug} loading={saving}>Add drug</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={batchOpen} onOpenChange={setBatchOpen}>
        <DialogContent title="Receive stock batch">
          <div className="space-y-3">
            <div>
              <Label>Drug *</Label>
              <AsyncCombobox value={batchDrug} onChange={(value) => { setBatchDrug(value); setErrors(current => ({ ...current, batchDrug: '' })) }} fetchOptions={(q) => pharmacyApi.drugs.autocomplete(q)} placeholder="Search drug" />
              <FieldError message={errors.batchDrug} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Batch number *</Label><Input required maxLength={50} aria-invalid={!!errors.batchNumber} error={!!errors.batchNumber} value={batchNumber} onChange={(e) => { setBatchNumber(e.target.value); setErrors(current => ({ ...current, batchNumber: '' })) }} /><FieldError message={errors.batchNumber} /></div>
              <div><Label>Expiry date *</Label><Input required type="date" aria-invalid={!!errors.expiryDate} error={!!errors.expiryDate} value={expiryDate} onChange={(e) => { setExpiryDate(e.target.value); setErrors(current => ({ ...current, expiryDate: '' })) }} /><FieldError message={errors.expiryDate} /></div>
              <div><Label>Quantity *</Label><Input required type="number" min={1} step={1} aria-invalid={!!errors.quantity} error={!!errors.quantity} value={quantity} onChange={(e) => { setQuantity(e.target.value); setErrors(current => ({ ...current, quantity: '' })) }} /><FieldError message={errors.quantity} /></div>
              <div><Label>Purchase price (₹)</Label><Input type="number" min={0} step="0.01" aria-invalid={!!errors.purchasePrice} error={!!errors.purchasePrice} value={purchasePrice} onChange={(e) => { setPurchasePrice(e.target.value); setErrors(current => ({ ...current, purchasePrice: '' })) }} /><FieldError message={errors.purchasePrice} /></div>
              <div><Label>Selling price (₹)</Label><Input type="number" min={0} step="0.01" aria-invalid={!!errors.sellingPrice} error={!!errors.sellingPrice} value={sellingPrice} onChange={(e) => { setSellingPrice(e.target.value); setErrors(current => ({ ...current, sellingPrice: '' })) }} /><FieldError message={errors.sellingPrice} /></div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setBatchOpen(false)}>Cancel</Button>
              <Button onClick={receiveBatch} loading={saving}>Receive batch</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AlertsTab() {
  const [lowStock, setLowStock] = useState<DrugBatch[]>([])
  const [expiring, setExpiring] = useState<DrugBatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([pharmacyApi.drugs.lowStock(), pharmacyApi.drugs.expiring(30)])
      .then(([ls, ex]) => { setLowStock(ls); setExpiring(ex) })
      .catch((err) => toast.error(apiErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageSpinner />

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <Card>
        <div className="p-4 border-b border-border flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning-500" />
          <h3 className="text-sm font-semibold">Low stock batches</h3>
        </div>
        {lowStock.length === 0 ? <EmptyState title="All stocked up" description="No batches at or below reorder level." /> : (
          <Table>
            <THead><TR><TH>Drug</TH><TH>Batch</TH><TH>Available</TH></TR></THead>
            <TBody>
              {lowStock.map(b => (
                <TR key={b.id}><TD className="font-medium">{b.drugName}</TD><TD className="font-mono text-xs">{b.batchNumber}</TD><TD className="text-danger-600 font-medium">{b.quantityAvailable}</TD></TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
      <Card>
        <div className="p-4 border-b border-border flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning-500" />
          <h3 className="text-sm font-semibold">Expiring within 30 days</h3>
        </div>
        {expiring.length === 0 ? <EmptyState title="Nothing expiring soon" /> : (
          <Table>
            <THead><TR><TH>Drug</TH><TH>Batch</TH><TH>Expiry</TH><TH>Qty</TH></TR></THead>
            <TBody>
              {expiring.map(b => (
                <TR key={b.id}><TD className="font-medium">{b.drugName}</TD><TD className="font-mono text-xs">{b.batchNumber}</TD><TD className="text-warning-600">{formatDate(b.expiryDate)}</TD><TD>{b.quantityAvailable}</TD></TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
