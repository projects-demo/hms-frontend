import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export function Dialog({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode }) {
  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>{children}</DialogPrimitive.Root>
}

export function DialogContent({ children, className, title, description }: { children: ReactNode; className?: string; title: string; description?: string }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in" />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface shadow-xl',
          'max-h-[90vh] overflow-y-auto scrollbar-thin',
          className,
        )}
      >
        <div className="flex items-start justify-between px-5 py-4 border-b border-border sticky top-0 bg-surface z-10">
          <div>
            <DialogPrimitive.Title className="text-sm font-semibold text-ink-900">{title}</DialogPrimitive.Title>
            {description && <DialogPrimitive.Description className="text-xs text-ink-500 mt-0.5">{description}</DialogPrimitive.Description>}
          </div>
          <DialogPrimitive.Close className="rounded-md p-1 text-ink-400 hover:bg-black/5 hover:text-ink-700">
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        </div>
        <div className="p-5">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
