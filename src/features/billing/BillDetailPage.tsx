import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, IndianRupee, Undo2, Ban } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select, SelectItem } from '@/components/ui/Select'
import { billingApi } from '@/lib/services/billing'
import type { Bill } from '@/types/domain'
import { formatCurrency } from '@/lib/utils'
import { apiErrorMessage } from '@/lib/api-client'
import { toast } from 'sonner'

export default function BillDetailPage() {
  const { id } = useParams<{ id: string }>()
  const billId = Number(id)
  const navigate = useNavigate()
  const [bill, setBill] = useState<Bill | null>(null)
  const [loading, setLoading] = useState(true)

  const [finalizeOpen, setFinalizeOpen] = useState(false)
  const [discount, setDiscount] = useState('0')
  const [tax, setTax] = useState('0')

  const [receiptOpen, setReceiptOpen] = useState(false)
  const [receiptAmount, setReceiptAmount] = useState('')
  const [paymentMode, setPaymentMode] = useState('CASH')

  const [refundOpen, setRefundOpen] = useState(false)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')

  const [saving, setSaving] = useState(false)

  function load() {
    setLoading(true)
    billingApi.bills.get(billId).then(setBill).catch((err) => toast.error(apiErrorMessage(err))).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [billId])

  async function handleFinalize() {
    setSaving(true)
    try {
      await billingApi.bills.finalize(billId, Number(discount) || 0, Number(tax) || 0)
      toast.success('Bill finalized')
      setFinalizeOpen(false)
      load()
    } catch (err) { toast.error(apiErrorMessage(err)) } finally { setSaving(false) }
  }

  async function handleReceipt() {
    if (!receiptAmount || Number(receiptAmount) <= 0) { toast.error('Enter a valid amount'); return }
    setSaving(true)
    try {
      await billingApi.bills.recordReceipt(billId, Number(receiptAmount), paymentMode)
      toast.success('Payment recorded')
      setReceiptOpen(false); setReceiptAmount('')
      load()
    } catch (err) { toast.error(apiErrorMessage(err)) } finally { setSaving(false) }
  }

  async function handleRefund() {
    if (!refundAmount || !refundReason.trim()) { toast.error('Amount and reason are required'); return }
    setSaving(true)
    try {
      await billingApi.bills.refund(billId, Number(refundAmount), refundReason)
      toast.success('Refund issued')
      setRefundOpen(false); setRefundAmount(''); setRefundReason('')
      load()
    } catch (err) { toast.error(apiErrorMessage(err)) } finally { setSaving(false) }
  }

  async function handleCancel() {
    setSaving(true)
    try {
      await billingApi.bills.cancel(billId)
      toast.success('Bill cancelled')
      load()
    } catch (err) { toast.error(apiErrorMessage(err)) } finally { setSaving(false) }
  }

  if (loading) return <PageSpinner />
  if (!bill) return null

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate('/billing')}>
        <ArrowLeft className="h-4 w-4" /> Back to billing
      </Button>

      <Card className="mb-5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CardTitle className="text-base font-mono">{bill.billNumber}</CardTitle>
            <StatusBadge status={bill.status} />
          </div>
          <div className="flex gap-2">
            {bill.status === 'DRAFT' && (
              <>
                <Button size="sm" onClick={() => setFinalizeOpen(true)}><CheckCircle2 className="h-3.5 w-3.5" /> Finalize</Button>
                <Button size="sm" variant="outline" onClick={handleCancel} loading={saving}><Ban className="h-3.5 w-3.5" /> Cancel</Button>
              </>
            )}
            {bill.status === 'FINALIZED' && bill.balanceAmount > 0 && (
              <Button size="sm" onClick={() => setReceiptOpen(true)}><IndianRupee className="h-3.5 w-3.5" /> Record payment</Button>
            )}
            {bill.paidAmount > 0 && (
              <Button size="sm" variant="outline" onClick={() => setRefundOpen(true)}><Undo2 className="h-3.5 w-3.5" /> Refund</Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 mb-5">
            <div><p className="text-xs text-ink-500">Subtotal</p><p className="text-lg font-semibold">{formatCurrency(bill.subtotalAmount)}</p></div>
            <div><p className="text-xs text-ink-500">Total</p><p className="text-lg font-semibold">{formatCurrency(bill.totalAmount)}</p></div>
            <div><p className="text-xs text-ink-500">Paid</p><p className="text-lg font-semibold text-success-600">{formatCurrency(bill.paidAmount)}</p></div>
            <div><p className="text-xs text-ink-500">Balance</p><p className={`text-lg font-semibold ${bill.balanceAmount > 0 ? 'text-danger-600' : 'text-success-600'}`}>{formatCurrency(bill.balanceAmount)}</p></div>
          </div>

          <Table>
            <THead><TR><TH>Description</TH><TH>Qty</TH><TH>Unit price</TH><TH>Amount</TH></TR></THead>
            <TBody>
              {bill.items.map(item => (
                <TR key={item.id}>
                  <TD>{item.description}</TD>
                  <TD>{item.quantity}</TD>
                  <TD>{formatCurrency(item.unitPrice)}</TD>
                  <TD className="font-medium">{formatCurrency(item.amount)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={finalizeOpen} onOpenChange={setFinalizeOpen}>
        <DialogContent title="Finalize bill" description="Apply discount/tax and lock the line items for payment.">
          <div className="space-y-3">
            <div><Label>Discount amount (₹)</Label><Input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} /></div>
            <div><Label>Tax amount (₹)</Label><Input type="number" value={tax} onChange={(e) => setTax(e.target.value)} /></div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setFinalizeOpen(false)}>Cancel</Button>
              <Button onClick={handleFinalize} loading={saving}>Finalize</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent title="Record payment" description={`Outstanding balance: ${formatCurrency(bill.balanceAmount)}`}>
          <div className="space-y-3">
            <div><Label>Amount (₹) *</Label><Input type="number" value={receiptAmount} onChange={(e) => setReceiptAmount(e.target.value)} /></div>
            <div>
              <Label>Payment mode</Label>
              <Select value={paymentMode} onValueChange={setPaymentMode}>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="CARD">Card</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="INSURANCE">Insurance</SelectItem>
                <SelectItem value="CHEQUE">Cheque</SelectItem>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setReceiptOpen(false)}>Cancel</Button>
              <Button onClick={handleReceipt} loading={saving}>Record payment</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent title="Issue refund">
          <div className="space-y-3">
            <div><Label>Amount (₹) *</Label><Input type="number" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} /></div>
            <div><Label>Reason *</Label><Input value={refundReason} onChange={(e) => setRefundReason(e.target.value)} /></div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setRefundOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={handleRefund} loading={saving}>Issue refund</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
