import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-9 w-full rounded-lg border bg-surface px-3 py-1 text-sm shadow-sm transition-colors',
        'placeholder:text-ink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:border-primary-500',
        'disabled:cursor-not-allowed disabled:opacity-50',
        error ? 'border-danger-500' : 'border-border-strong',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'
