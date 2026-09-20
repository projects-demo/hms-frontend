import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function StatCard({
  label, value, icon, tone = 'primary', hint, to,
}: { label: string; value: ReactNode; icon: ReactNode; tone?: 'primary' | 'accent' | 'success' | 'warning'; hint?: string; to?: string }) {
  const toneClasses: Record<string, string> = {
    primary: 'bg-primary-50 text-primary-600',
    accent: 'bg-accent-50 text-accent-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
  }

  const content = (
    <>
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', toneClasses[tone])}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-ink-500">{label}</p>
        <p className="text-2xl font-semibold text-ink-900 mt-0.5 tabular-nums">{value}</p>
        {hint && <p className="text-xs text-ink-400 mt-0.5">{hint}</p>}
      </div>
    </>
  )

  const className = 'rounded-xl border border-border bg-surface p-4 shadow-sm flex items-start gap-3'

  if (to) {
    return (
      <Link to={to} className={cn(className, 'transition-all hover:shadow-md hover:border-primary-300 cursor-pointer')}>
        {content}
      </Link>
    )
  }

  return <div className={className}>{content}</div>
}