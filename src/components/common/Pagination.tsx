import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function Pagination({
  page, totalPages, totalElements, onPageChange,
}: { page: number; totalPages: number; totalElements: number; onPageChange: (page: number) => void }) {
  if (totalElements === 0) return null
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <p className="text-xs text-ink-500">
        Page <span className="font-medium text-ink-700">{page + 1}</span> of{' '}
        <span className="font-medium text-ink-700">{Math.max(totalPages, 1)}</span> · {totalElements} total
      </p>
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="sm" disabled={page <= 0} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-3.5 w-3.5" /> Prev
        </Button>
        <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
