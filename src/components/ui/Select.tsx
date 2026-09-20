import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export function Select({ value, onValueChange, placeholder, children, className, disabled }: {
  value?: string; onValueChange?: (v: string) => void; placeholder?: string; children: ReactNode; className?: string; disabled?: boolean
}) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-lg border border-border-strong bg-surface px-3 py-1 text-sm shadow-sm',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed',
          'data-[placeholder]:text-ink-400',
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon><ChevronDown className="h-4 w-4 text-ink-500" /></SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content className="z-50 overflow-hidden rounded-lg border border-border bg-surface shadow-lg" position="popper" sideOffset={4}>
          <SelectPrimitive.Viewport className="p-1 max-h-72">{children}</SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

export function SelectItem({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  return (
    <SelectPrimitive.Item
      value={value}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-md py-1.5 pl-7 pr-3 text-sm outline-none',
        'hover:bg-primary-50 focus:bg-primary-50 data-[state=checked]:font-medium',
        className,
      )}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator><Check className="h-3.5 w-3.5 text-primary-600" /></SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}
