import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Undo2, Pencil, Printer, Trash2 } from 'lucide-react'
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
import type { Bill, DiscountMaster, PaymentReceipt } from '@/types/domain'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { apiErrorMessage } from '@/lib/api-client'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/AuthContext'
import { FieldError } from '@/components/common/FieldError'
import { CreateBillDialog } from './CreateBillDialog'
import { patientsApi } from '@/lib/services/patients'
import type { Patient } from '@/types/domain'
import { useBranding } from '@/features/branding/BrandingContext'

export default function BillDetailPage() {
  const { id } = useParams<{ id: string }>()
  const billId = Number(id)
  const navigate = useNavigate()
  const [bill, setBill] = useState<Bill | null>(null)
  const [loading, setLoading] = useState(true)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [voidOpen, setVoidOpen] = useState(false)
  const [voidPassword, setVoidPassword] = useState('')
  const [voidError, setVoidError] = useState('')
  const [voiding, setVoiding] = useState(false)

  const [finalizeOpen, setFinalizeOpen] = useState(false)
  const [discountMasterId, setDiscountMasterId] = useState('')
  const [discounts, setDiscounts] = useState<DiscountMaster[]>([])
  const [tax, setTax] = useState('0')

  const [receiptPrintOpen, setReceiptPrintOpen] = useState(false)
  const [lastReceipt, setLastReceipt] = useState<PaymentReceipt | null>(null)
  const [paymentMode, setPaymentMode] = useState('CASH')

  const [refundOpen, setRefundOpen] = useState(false)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')

  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({ tax: '', refundAmount: '', refundReason: '' })
  const { session } = useAuth()
  const { branding } = useBranding()
  const isAdmin = session?.role === 'HOSPITAL_ADMIN'

  function printDocument(kind: 'invoice' | 'receipt') {
    document.body.classList.remove('print-invoice', 'print-receipt')
    document.body.classList.add(kind === 'invoice' ? 'print-invoice' : 'print-receipt')
    window.addEventListener('afterprint', () => {
      document.body.classList.remove('print-invoice', 'print-receipt')
    }, { once: true })
    window.print()
  }

  function load() {
    setLoading(true)
    billingApi.bills.get(billId).then(setBill).catch((err) => toast.error(apiErrorMessage(err))).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [billId])

  useEffect(() => {
    if (bill) patientsApi.get(bill.patientId).then(setPatient).catch((err) => toast.error(apiErrorMessage(err)))
  }, [bill?.patientId])

  async function handleFinalize() {
    const taxValue = Number(tax)
    const taxError = Number.isFinite(taxValue) && taxValue >= 0 ? '' : 'Tax must be a non-negative amount.'
    setErrors(current => ({ ...current, tax: taxError }))
    if (taxError) return
    setSaving(true)
    try {
      const submittedBill = await billingApi.bills.finalize(
        billId,
        isAdmin && discountMasterId && discountMasterId !== 'none' ? Number(discountMasterId) : undefined,
        Number(tax) || 0,
        paymentMode as 'CASH' | 'UPI' | 'CARD',
      )
      setBill(submittedBill)
      setFinalizeOpen(false)
      toast.success('Bill submitted and payment recorded')
      if (submittedBill.paidAmount > 0) {
        try {
          const receipts = await billingApi.bills.patientReceiptHistory(submittedBill.patientId, { page: 0, size: 100 })
          const receipt = receipts.content.find(item => item.billId === submittedBill.id)
          if (receipt) {
            setLastReceipt(receipt)
            setReceiptPrintOpen(true)
          } else toast.error('Bill submitted; receipt history could not be loaded for printing.')
        } catch { toast.error('Bill submitted; receipt history could not be loaded for printing.') }
      }
    } catch (err) { toast.error(apiErrorMessage(err)) } finally { setSaving(false) }
  }

  async function handleRefund() {
    const value = Number(refundAmount)
    const nextErrors = {
      refundAmount: Number.isFinite(value) && value > 0 && value <= bill!.paidAmount
        ? '' : `Enter an amount greater than 0 and no more than ${bill!.paidAmount}.`,
      refundReason: refundReason.trim() ? '' : 'Refund reason is required.',
    }
    setErrors(current => ({ ...current, ...nextErrors }))
    if (Object.values(nextErrors).some(Boolean)) { toast.error('Please correct the highlighted fields'); return }
    setSaving(true)
    try {
      await billingApi.bills.refund(billId, Number(refundAmount), refundReason)
      toast.success('Refund issued')
      setRefundOpen(false); setRefundAmount(''); setRefundReason('')
      load()
    } catch (err) { toast.error(apiErrorMessage(err)) } finally { setSaving(false) }
  }

  async function handleVoid() {
    if (!bill) return
    if (!voidPassword.trim()) { setVoidError('Enter your password to confirm.'); return }
    setVoiding(true)
    try {
      const voidedBill = await billingApi.bills.voidBill(billId, voidPassword)
      setBill(voidedBill)
      setVoidOpen(false)
      setVoidPassword('')
      setVoidError('')
      toast.success('Bill voided; payment and audit history were retained')
    } catch (err) { toast.error(apiErrorMessage(err)) } finally { setVoiding(false) }
  }

  async function openFinalize() {
    setDiscountMasterId('')
    setTax('0')
    setPaymentMode('CASH')
    if (isAdmin) {
      try {
        setDiscounts(await billingApi.discounts.list())
      } catch (err) {
        toast.error(apiErrorMessage(err))
        return
      }
    }
    setFinalizeOpen(true)
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
                <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}><Pencil className="h-3.5 w-3.5" /> Edit draft</Button>
                <Button size="sm" onClick={openFinalize}><CheckCircle2 className="h-3.5 w-3.5" /> Submit bill</Button>
              </>
            )}
            {bill.paidAmount > 0 && (
              <Button size="sm" variant="outline" onClick={() => setRefundOpen(true)}><Undo2 className="h-3.5 w-3.5" /> Refund</Button>
            )}
            {bill.finalizedAt && (
              <Button size="sm" variant="outline" onClick={() => printDocument('invoice')}><Printer className="h-3.5 w-3.5" /> Print / Save PDF</Button>
            )}
            {isAdmin && bill.status !== 'CANCELLED' && (
              <Button size="sm" variant="danger" onClick={() => { setVoidPassword(''); setVoidError(''); setVoidOpen(true) }}>
                <Trash2 className="h-3.5 w-3.5" /> Void bill
              </Button>
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
          <div className="ml-auto mt-4 max-w-sm space-y-2 border-t border-border pt-3 text-sm">
            <div className="flex justify-between"><span className="text-ink-500">Subtotal</span><span>{formatCurrency(bill.subtotalAmount)}</span></div>
            {bill.discountAmount > 0 && (
              <div className="flex justify-between text-success-600">
                <span>Discount{bill.discountPercentage != null ? ` (${bill.discountPercentage}%)` : ''}</span>
                <span>− {formatCurrency(bill.discountAmount)}</span>
              </div>
            )}
            {bill.taxAmount > 0 && <div className="flex justify-between"><span className="text-ink-500">Tax</span><span>{formatCurrency(bill.taxAmount)}</span></div>}
            <div className="flex justify-between border-t border-border pt-2 font-semibold"><span>Total</span><span>{formatCurrency(bill.totalAmount)}</span></div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={finalizeOpen} onOpenChange={setFinalizeOpen}>
        <DialogContent title="Submit bill" description="Apply discount and tax, select the payment method, and submit the bill in one step.">
          <div className="space-y-3">
            {isAdmin && (
              <div>
                <Label>Configured discount</Label>
                <Select value={discountMasterId} onValueChange={setDiscountMasterId} placeholder="No discount">
                  <SelectItem value="none">No discount</SelectItem>
                  {discounts.map(discountOption => (
                    <SelectItem key={discountOption.id} value={String(discountOption.id)}>
                      {discountOption.name} — {discountOption.percentage}%
                    </SelectItem>
                  ))}
                </Select>
                {discountMasterId && discountMasterId !== 'none' && (
                  <p className="mt-1 text-xs text-success-600">
                    Discount: {formatCurrency(bill.subtotalAmount * (discounts.find(option => String(option.id) === discountMasterId)?.percentage ?? 0) / 100)}
                  </p>
                )}
              </div>
            )}
            <div><Label>Tax amount (₹)</Label><Input type="number" min={0} step="0.01" aria-invalid={!!errors.tax} error={!!errors.tax} value={tax} onChange={(e) => { setTax(e.target.value); setErrors(current => ({ ...current, tax: '' })) }} /><FieldError message={errors.tax} /></div>
            <div className="rounded-md bg-canvas px-3 py-2 text-sm">
              <span className="text-ink-500">Amount to collect </span>
              <strong>{formatCurrency(
                bill.subtotalAmount
                - (discountMasterId && discountMasterId !== 'none'
                  ? bill.subtotalAmount * (discounts.find(option => String(option.id) === discountMasterId)?.percentage ?? 0) / 100
                  : 0)
                + (Number(tax) || 0),
              )}</strong>
            </div>
            <div>
              <Label>Payment method *</Label>
              <Select value={paymentMode} onValueChange={setPaymentMode}>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="CARD">Card</SelectItem>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setFinalizeOpen(false)}>Cancel</Button>
              <Button onClick={handleFinalize} loading={saving}>Submit bill</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={receiptPrintOpen} onOpenChange={setReceiptPrintOpen}>
        <DialogContent title="Payment receipt recorded" description="Print this receipt or choose Save as PDF in the print dialog.">
          {lastReceipt && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-canvas p-4 text-sm">
                <p className="font-mono font-semibold">{lastReceipt.receiptNumber}</p>
                <p className="mt-1">{lastReceipt.patientName} · {lastReceipt.patientCode}</p>
                <p className="text-ink-500">{lastReceipt.billNumber} · {lastReceipt.paymentMode}</p>
                <p className="mt-2 text-lg font-semibold">{formatCurrency(lastReceipt.amount)}</p>
                <p className="text-xs text-ink-500">{formatDateTime(lastReceipt.receivedAt)}</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setReceiptPrintOpen(false)}>Close</Button>
                <Button onClick={() => printDocument('receipt')}><Printer className="h-4 w-4" /> Print / Save PDF</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent title="Issue refund">
          <div className="space-y-3">
            <div><Label>Amount (₹) *</Label><Input type="number" required min={0.01} max={bill.paidAmount} step="0.01" aria-invalid={!!errors.refundAmount} error={!!errors.refundAmount} value={refundAmount} onChange={(e) => { setRefundAmount(e.target.value); setErrors(current => ({ ...current, refundAmount: '' })) }} /><FieldError message={errors.refundAmount} /></div>
            <div><Label>Reason *</Label><Input required maxLength={500} aria-invalid={!!errors.refundReason} error={!!errors.refundReason} value={refundReason} onChange={(e) => { setRefundReason(e.target.value); setErrors(current => ({ ...current, refundReason: '' })) }} /><FieldError message={errors.refundReason} /></div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setRefundOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={handleRefund} loading={saving}>Issue refund</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

        <CreateBillDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          bill={bill}
          onSaved={(updatedBill) => { setBill(updatedBill); setEditOpen(false) }}
        />

        <Dialog open={voidOpen} onOpenChange={setVoidOpen}>
          <DialogContent title="Void bill" description="The bill will be removed from active billing totals. Receipt, refund, and audit history will be retained.">
            <div className="space-y-3">
              <p className="text-sm text-ink-600">Voiding does not automatically refund any payment already collected. Confirm using your hospital admin password.</p>
              <div>
                <Label>Admin password *</Label>
                <Input
                  type="password"
                  autoComplete="current-password"
                  required
                  aria-invalid={!!voidError}
                  error={!!voidError}
                  value={voidPassword}
                  onChange={(event) => { setVoidPassword(event.target.value); setVoidError('') }}
                />
                <FieldError message={voidError} />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" onClick={() => setVoidOpen(false)}>Keep bill</Button>
                <Button variant="danger" onClick={handleVoid} loading={voiding}>Confirm void</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <section className="invoice-print-area" aria-label="Printable hospital invoice">
          <header className="invoice-header">
            <div className="invoice-hospital">
              {branding.logoDataUrl && <img className="invoice-logo" src={branding.logoDataUrl} alt="Hospital logo" />}
              <div>
                <h1>{session?.hospitalName || 'Hospital'}</h1>
                {session?.tenantCode && <p>{session.tenantCode}</p>}
              </div>
            </div>
            <div className="invoice-title">
              <h2>{bill.status === 'CANCELLED' ? 'VOID INVOICE' : 'INVOICE'}</h2>
              <p>{bill.billNumber}</p>
            </div>
          </header>

          <div className="invoice-meta">
            <div><strong>Patient</strong><span>{patient ? `${patient.firstName} ${patient.lastName}` : `Patient #${bill.patientId}`}</span></div>
            <div><strong>Patient code</strong><span>{patient?.patientCode || '—'}</span></div>
            <div><strong>Phone</strong><span>{patient?.primaryPhone || '—'}</span></div>
            <div><strong>Bill type</strong><span>{bill.billType}</span></div>
            <div><strong>Doctor</strong><span>{bill.doctorName || 'Self'}</span></div>
            <div><strong>Invoice date</strong><span>{bill.finalizedAt ? formatDateTime(bill.finalizedAt) : formatDateTime(new Date().toISOString())}</span></div>
            <div><strong>Status</strong><span>{bill.status === 'CANCELLED' ? 'VOIDED' : 'SUBMITTED'}</span></div>
          </div>

          <table className="invoice-items">
            <thead><tr><th>Description</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead>
            <tbody>{bill.items.map(item => (
              <tr key={item.id}>
                <td>{item.description}</td><td>{item.quantity}</td>
                <td>{formatCurrency(item.unitPrice)}</td><td>{formatCurrency(item.amount)}</td>
              </tr>
            ))}</tbody>
          </table>

          <div className="invoice-totals">
            <div><span>Subtotal</span><span>{formatCurrency(bill.subtotalAmount)}</span></div>
            {bill.discountAmount > 0 && <div><span>Discount</span><span>− {formatCurrency(bill.discountAmount)}</span></div>}
            {bill.taxAmount > 0 && <div><span>Tax</span><span>{formatCurrency(bill.taxAmount)}</span></div>}
            <div className="invoice-grand-total"><strong>Total</strong><strong>{formatCurrency(bill.totalAmount)}</strong></div>
            <div><span>Paid</span><span>{formatCurrency(bill.paidAmount)}</span></div>
            <div><strong>Balance due</strong><strong>{formatCurrency(bill.balanceAmount)}</strong></div>
          </div>

          {branding.footerText && <footer className="invoice-footer">{branding.footerText}</footer>}
        </section>

        {lastReceipt && (
          <section className="receipt-print-area" aria-label="Printable payment receipt">
            <header className="invoice-header">
              <div className="invoice-hospital">
                {branding.logoDataUrl && <img className="invoice-logo" src={branding.logoDataUrl} alt="Hospital logo" />}
                <div><h1>{session?.hospitalName || 'Hospital'}</h1>{session?.tenantCode && <p>{session.tenantCode}</p>}</div>
              </div>
              <div className="invoice-title"><h2>PAYMENT RECEIPT</h2><p>{lastReceipt.receiptNumber}</p></div>
            </header>
            <div className="invoice-meta">
              <div><strong>Patient</strong><span>{lastReceipt.patientName}</span></div>
              <div><strong>Patient ID</strong><span>{lastReceipt.patientId}</span></div>
              <div><strong>Patient code</strong><span>{lastReceipt.patientCode}</span></div>
              <div><strong>Mobile</strong><span>{lastReceipt.patientPhone}</span></div>
              <div><strong>Bill number</strong><span>{lastReceipt.billNumber}</span></div>
              <div><strong>OPD ID</strong><span>{lastReceipt.appointmentCode || lastReceipt.appointmentId || '—'}</span></div>
              <div><strong>Payment date</strong><span>{formatDateTime(lastReceipt.receivedAt)}</span></div>
              <div><strong>Payment method</strong><span>{lastReceipt.paymentMode}</span></div>
              <div><strong>Received by</strong><span>{session?.fullName || session?.username || '—'}</span></div>
            </div>
            <div className="receipt-paid-amount">Amount received: {formatCurrency(lastReceipt.amount)}</div>
            {branding.footerText && <footer className="invoice-footer">{branding.footerText}</footer>}
          </section>
        )}
    </div>
  )
}
