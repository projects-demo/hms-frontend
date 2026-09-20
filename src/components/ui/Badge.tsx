import { type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', {
  variants: {
    variant: {
      neutral: 'bg-black/5 text-ink-700',
      primary: 'bg-primary-100 text-primary-700',
      accent: 'bg-accent-100 text-accent-700',
      success: 'bg-success-50 text-success-600',
      warning: 'bg-warning-50 text-warning-600',
      danger: 'bg-danger-50 text-danger-600',
      info: 'bg-info-50 text-info-600',
    },
  },
  defaultVariants: { variant: 'neutral' },
})

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

// Common status -> variant mapping used across the app
const STATUS_VARIANTS: Record<string, BadgeProps['variant']> = {
  ACTIVE: 'success', AVAILABLE: 'success', COMPLETED: 'success', PAID: 'success', FINALIZED: 'primary',
  DISCHARGED: 'neutral', SCHEDULED: 'info', CHECKED_IN: 'info', IN_CONSULTATION: 'warning',
  BOOKED: 'warning', OCCUPIED: 'warning', ADMITTED: 'warning', DRAFT: 'neutral',
  CANCELLED: 'danger', NO_SHOW: 'danger', DEACTIVATED: 'danger', SUSPENDED: 'danger',
  ON_LEAVE: 'warning', INACTIVE: 'neutral', MAINTENANCE: 'neutral', BLOCKED: 'neutral',
  PROVISIONING: 'info', TRANSFERRED: 'neutral', DECEASED: 'danger',
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={STATUS_VARIANTS[status] ?? 'neutral'}>{status.replace(/_/g, ' ')}</Badge>
}
