import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export function Tabs({ value, onValueChange, children, className }: { value: string; onValueChange: (v: string) => void; children: ReactNode; className?: string }) {
  return <TabsPrimitive.Root value={value} onValueChange={onValueChange} className={className}>{children}</TabsPrimitive.Root>
}
export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  return <TabsPrimitive.List className={cn('inline-flex items-center gap-1 rounded-lg bg-black/5 p-1', className)}>{children}</TabsPrimitive.List>
}
export function TabsTrigger({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  return (
    <TabsPrimitive.Trigger
      value={value}
      className={cn(
        'rounded-md px-3 py-1.5 text-sm font-medium text-ink-500 transition-colors',
        'data-[state=active]:bg-surface data-[state=active]:text-ink-900 data-[state=active]:shadow-sm',
        className,
      )}
    >
      {children}
    </TabsPrimitive.Trigger>
  )
}
export function TabsContent({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  return <TabsPrimitive.Content value={value} className={cn('mt-4', className)}>{children}</TabsPrimitive.Content>
}
