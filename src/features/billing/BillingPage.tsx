import { useEffect, useState } from 'react'
import { Plus, Receipt, Settings2, ScrollText } from 'lucide-react'
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
import { Input } from '@/components/ui/Input'
import { usePaginated } from '@/hooks/usePaginated'
import { useDebounce } from '@/hooks/useDebounce'
import { billingApi } from '@/lib/services/billing'
import type { BillStatus } from '@/types/domain'
import { formatCurrency } from '@/lib/utils'
import { CreateBillDialog } from './CreateBillDialog'
import { DiscountMasterManagerDialog } from './DiscountMasterManagerDialog'
import { BillingAuditDialog } from './BillingAuditDialog'
import { useAuth } from '@/features/auth/AuthContext'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import type { Bill, PaymentReceipt } from '@/types/domain'
import type { PageResponse } from '@/types/api'
import { formatDateTime } from '@/lib/utils'

export default function BillingPage() {
  const [status, setStatus] = useState('ALL')
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query)
  const [createOpen, setCreateOpen] = useState(false)
  const [manageDiscountsOpen, setManageDiscountsOpen] = useState(false)
  const [auditOpen, setAuditOpen] = useState(false)
  const [historyBill, setHistoryBill] = useState<Bill | null>(null)
  const [historyPage, setHistoryPage] = useState(0)
  const [paymentHistory, setPaymentHistory] = useState<PageResponse<PaymentReceipt> | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const navigate = useNavigate()
  const { session } = useAuth()
  const isAdmin = session?.role === 'HOSPITAL_ADMIN'

  useEffect(() => {
    if (!historyBill) return
    let active = true
    setHistoryLoading(true)
    billingApi.bills.patientReceiptHistory(historyBill.patientId, { page: historyPage, size: 10 })
      .then(result => { if (active) setPaymentHistory(result) })
      .catch(() => { if (active) setPaymentHistory(null) })
      .finally(() => { if (active) setHistoryLoading(false) })
    return () => { active = false }
  }, [historyBill?.patientId, historyPage])

  const { data, loading, page, setPage } = usePaginated(
    (page, size) => billingApi.bills.search({ q: debouncedQuery || undefined, status: status === 'ALL' ? undefined : (status as BillStatus), page, size }),
    [status, debouncedQuery],
  )

  return (
    <div>
      <PageHeader
        title="Billing"
        description="Search patients, prepare draft bills, and submit with payment."
        actions={<div className="flex gap-2">
          {isAdmin && <Button variant="outline" onClick={() => navigate('/billing/charge-master')}><Settings2 className="h-4 w-4" /> Standard items</Button>}
          {isAdmin && <Button variant="outline" onClick={() => setManageDiscountsOpen(true)}><Settings2 className="h-4 w-4" /> Discounts</Button>}
          {isAdmin && <Button variant="outline" onClick={() => setAuditOpen(true)}><ScrollText className="h-4 w-4" /> Audit trail</Button>}
          <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Create bill</Button>
        </div>}
      />

      <Card>
        <div className="p-4 border-b border-border flex flex-wrap items-center gap-3">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search patient name, mobile, ID or patient code"
            className="w-full max-w-md"
          />
          <Select value={status} onValueChange={setStatus} className="w-44">
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="FINALIZED">Submitted</SelectItem>
            <SelectItem value="CANCELLED">Voided</SelectItem>
          </Select>
        </div>

        {loading ? <PageSpinner /> : !data || data.content.length === 0 ? (
          <EmptyState icon={<Receipt className="h-10 w-10" />} title="No bills yet"
            action={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Create bill</Button>} />
        ) : (
          <>
            <Table>
              <THead><TR><TH>Bill #</TH><TH>Patient</TH><TH>Patient ID</TH><TH>Mobile</TH><TH>Advisor / Doctor</TH><TH>OPD ID</TH><TH>Type</TH><TH>Date &amp; Time</TH><TH>Total</TH><TH>Paid</TH><TH>Balance</TH><TH>Status</TH></TR></THead>
              <TBody>
                {data.content.map(b => (
                  <TR key={b.id} className="cursor-pointer" onClick={() => navigate(`/billing/${b.id}`)}>
                    <TD className="font-mono text-xs">{b.billNumber}</TD>
                    <TD>
                      <button type="button" className="text-left font-medium text-primary-700 hover:underline" onClick={(event) => { event.stopPropagation(); setHistoryBill(b); setHistoryPage(0); setPaymentHistory(null) }}>
                        {b.patientName || '—'}
                        {b.patientCode && <span className="block text-xs font-normal text-ink-500">{b.patientCode}</span>}
                      </button>
                    </TD>
                    <TD className="font-mono text-xs">{b.patientId}</TD>
                    <TD>{b.patientPhone || '—'}</TD>
                    <TD>
                      {b.advisorType === 'INTERNAL_DOCTOR' ? (
                        <span className="text-primary-700">{b.doctorName || '—'}</span>
                      ) : b.advisorType === 'EXTERNAL_DOCTOR' ? (
                        <span className="text-ink-500">Ext: {b.doctorName || '—'}</span>
                      ) : (
                        <span className="text-ink-400">Self</span>
                      )}
                    </TD>
                    <TD className="font-mono text-xs">{b.appointmentCode || '—'}</TD>
                    <TD>{b.billType}</TD>
                    <TD className="whitespace-nowrap text-xs">
                      {b.createdAt ? formatDateTime(b.createdAt) : '—'}
                    </TD>
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
      <Dialog open={!!historyBill} onOpenChange={(open) => { if (!open) { setHistoryBill(null); setPaymentHistory(null) } }}>
        <DialogContent title={`Payment history — ${historyBill?.patientName ?? 'Patient'}`} description={`Patient ID ${historyBill?.patientId ?? ''} · ${historyBill?.patientPhone ?? 'No mobile on file'}`} className="max-w-2xl">
          {historyLoading ? <p className="text-sm text-ink-500">Loading payment history…</p>
            : !paymentHistory || paymentHistory.content.length === 0 ? <p className="text-sm text-ink-500">No payments recorded for this patient.</p>
            : <>
              <div className="max-h-[55vh] overflow-auto">
                <Table>
                  <THead><TR><TH>Receipt</TH><TH>Bill</TH><TH>Date</TH><TH>Method</TH><TH className="text-right">Amount</TH></TR></THead>
                  <TBody>{paymentHistory.content.map(receipt => (
                    <TR key={receipt.id}>
                      <TD className="font-mono text-xs">{receipt.receiptNumber}</TD>
                      <TD className="font-mono text-xs">{receipt.billNumber}</TD>
                      <TD>{formatDateTime(receipt.receivedAt)}</TD>
                      <TD>{receipt.paymentMode}</TD>
                      <TD className="text-right font-medium">{formatCurrency(receipt.amount)}</TD>
                    </TR>
                  ))}</TBody>
                </Table>
              </div>
              <Pagination page={paymentHistory.page} totalPages={paymentHistory.totalPages} totalElements={paymentHistory.totalElements} onPageChange={setHistoryPage} />
            </>}
        </DialogContent>
      </Dialog>
      {isAdmin && <DiscountMasterManagerDialog open={manageDiscountsOpen} onOpenChange={setManageDiscountsOpen} />}
      {isAdmin && <BillingAuditDialog open={auditOpen} onOpenChange={setAuditOpen} />}
    </div>
  )
}