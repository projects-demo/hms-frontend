import { useEffect, useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { PageSpinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/common/Pagination'
import { billingApi } from '@/lib/services/billing'
import type { PageResponse } from '@/types/api'
import type { BillingAuditLog } from '@/types/domain'
import { formatDateTime } from '@/lib/utils'
import { apiErrorMessage } from '@/lib/api-client'
import { toast } from 'sonner'

export function BillingAuditDialog({ open, onOpenChange }: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [data, setData] = useState<PageResponse<BillingAuditLog> | null>(null)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    billingApi.auditLogs.search({ page, size: 20 })
      .then(setData)
      .catch(err => toast.error(apiErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [open, page])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Billing audit trail" description="Append-only history of billing activity. Audit records cannot be edited or deleted." className="max-w-6xl">
        {loading ? <PageSpinner /> : !data || data.content.length === 0 ? (
          <EmptyState title="No billing activity yet" description="Bill creation, payments, refunds, cancellations, and billing configuration changes will appear here." />
        ) : (
          <>
            <div className="max-h-[60vh] overflow-auto rounded-lg border border-border">
              <Table>
                <THead><TR><TH>When</TH><TH>Activity</TH><TH>Record</TH><TH>Performed by</TH><TH>Details</TH></TR></THead>
                <TBody>
                  {data.content.map(log => (
                    <TR key={log.id}>
                      <TD className="whitespace-nowrap text-xs">{formatDateTime(log.createdAt)}</TD>
                      <TD className="font-medium">{log.action.replace(/_/g, ' ')}</TD>
                      <TD className="whitespace-nowrap text-xs">
                        {log.billId ? `Bill #${log.billId}` : `${log.entityType.replace(/_/g, ' ')} #${log.entityId ?? '—'}`}
                      </TD>
                      <TD className="whitespace-nowrap text-xs">{log.actorName}<br /><span className="text-ink-400">{log.actorUsername} · {log.actorRole.replace(/_/g, ' ')}</span></TD>
                      <TD><pre className="max-w-[24rem] whitespace-pre-wrap break-words text-[11px] text-ink-500">{log.details}</pre></TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
            <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}