import { useState } from 'react'
import { Plus, Receipt } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination } from '@/components/common/Pagination'
import { Card } from '@/components/ui/Card'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Select, SelectItem } from '@/components/ui/Select'
import { usePaginated } from '@/hooks/usePaginated'
import { billingApi } from '@/lib/services/billing'
import type { BillStatus } from '@/types/domain'
import { formatCurrency } from '@/lib/utils'
import { CreateBillDialog } from './CreateBillDialog'

export default function BillingPage() {
  const [status, setStatus] = useState('ALL')
  const [createOpen, setCreateOpen] = useState(false)
  const navigate = useNavigate()

  const { data, loading, page, setPage } = usePaginated(
    (page, size) => billingApi.bills.search({ status: status === 'ALL' ? undefined : (status as BillStatus), page, size }),
    [status],
  )

  return (
    <div>
      <PageHeader
        title="Billing"
        description="Create, finalize and collect payment on patient bills."
        actions={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Create bill</Button>}
      />

      <Card>
        <div className="p-4 border-b border-border">
          <Select value={status} onValueChange={setStatus} className="w-44">
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="FINALIZED">Finalized</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </Select>
        </div>

        {loading ? <PageSpinner /> : !data || data.content.length === 0 ? (
          <EmptyState icon={<Receipt className="h-10 w-10" />} title="No bills yet"
            action={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Create bill</Button>} />
        ) : (
          <>
            <Table>
              <THead><TR><TH>Bill #</TH><TH>Type</TH><TH>Total</TH><TH>Paid</TH><TH>Balance</TH><TH>Status</TH></TR></THead>
              <TBody>
                {data.content.map(b => (
                  <TR key={b.id} className="cursor-pointer" onClick={() => navigate(`/billing/${b.id}`)}>
                    <TD className="font-mono text-xs">{b.billNumber}</TD>
                    <TD>{b.billType}</TD>
                    <TD>{formatCurrency(b.totalAmount)}</TD>
                    <TD>{formatCurrency(b.paidAmount)}</TD>
                    <TD className={b.balanceAmount > 0 ? 'text-danger-600 font-medium' : 'text-success-600'}>{formatCurrency(b.balanceAmount)}</TD>
                    <TD><StatusBadge status={b.status} /></TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <Pagination page={page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
          </>
        )}
      </Card>

      <CreateBillDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}