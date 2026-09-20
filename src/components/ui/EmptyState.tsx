import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function EmptyState({
  icon, title, description, action, className,
}: { icon?: ReactNode; title: string; description?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-14 px-6', className)}>
      {icon && <div className="mb-3 text-ink-400">{icon}</div>}
      <p className="text-sm font-semibold text-ink-900">{title}</p>
      {description && <p className="text-sm text-ink-500 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
