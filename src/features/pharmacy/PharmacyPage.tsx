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
import { formatCurrency, formatDate } from '@/lib/utils'
import { apiErrorMessage } from '@/lib/api-client'
import { toast } from 'sonner'
import { DispenseDialog } from './DispenseDialog'

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
    if (!name.trim()) { toast.error('Drug name is required'); return }
    setSaving(true)
    try {
      await pharmacyApi.drugs.create({ name, genericName: genericName || undefined, manufacturer: manufacturer || undefined, category: category || undefined, reorderLevel: Number(reorderLevel) })
      toast.success('Drug added to catalog')
      setCreateOpen(false)
      setName(''); setGenericName(''); setManufacturer(''); setCategory(''); setReorderLevel('10')
      reload()
    } catch (err) { toast.error(apiErrorMessage(err)) } finally { setSaving(false) }
  }

  async function receiveBatch() {
    if (!batchDrug || !batchNumber || !expiryDate || !quantity) { toast.error('All batch fields are required'); return }
    setSaving(true)
    try {
      await pharmacyApi.drugs.receiveBatch({
        drugId: batchDrug.id, batchNumber, expiryDate, quantity: Number(quantity),
        purchasePrice: Number(purchasePrice) || 0, sellingPrice: Number(sellingPrice) || 0,
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
            <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>Generic name</Label><Input value={genericName} onChange={(e) => setGenericName(e.target.value)} /></div>
            <div><Label>Manufacturer</Label><Input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} /></div>
            <div><Label>Category</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Tablet, Syrup, Injection..." /></div>
            <div><Label>Reorder level</Label><Input type="number" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} /></div>
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
              <AsyncCombobox value={batchDrug} onChange={setBatchDrug} fetchOptions={(q) => pharmacyApi.drugs.autocomplete(q)} placeholder="Search drug" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Batch number *</Label><Input value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} /></div>
              <div><Label>Expiry date *</Label><Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} /></div>
              <div><Label>Quantity *</Label><Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} /></div>
              <div><Label>Purchase price (₹)</Label><Input type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} /></div>
              <div><Label>Selling price (₹)</Label><Input type="number" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} /></div>
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
