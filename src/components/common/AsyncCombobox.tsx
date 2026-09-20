import { useEffect, useRef, useState } from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { Search, ChevronDown, Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/useDebounce'
import type { OptionDto } from '@/types/api'

interface Props {
  value: OptionDto | null
  onChange: (option: OptionDto | null) => void
  fetchOptions: (query: string) => Promise<OptionDto[]>
  placeholder?: string
  minChars?: number
  className?: string
}

/** Typeahead picker backed by a backend /autocomplete endpoint - used for patient/doctor/drug/charge pickers. */
export function AsyncCombobox({ value, onChange, fetchOptions, placeholder = 'Search...', minChars = 1, className }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)
  const [options, setOptions] = useState<OptionDto[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (debouncedQuery.length < minChars) { setOptions([]); return }
    setLoading(true)
    fetchOptions(debouncedQuery)
      .then(setOptions)
      .catch(() => setOptions([]))
      .finally(() => setLoading(false))
  }, [debouncedQuery, minChars, fetchOptions])

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-9 w-full items-center justify-between rounded-lg border border-border-strong bg-surface px-3 text-sm shadow-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500',
            className,
          )}
        >
          <span className={cn('truncate text-left', !value && 'text-ink-400')}>
            {value ? value.label : placeholder}
          </span>
          <ChevronDown className="h-4 w-4 text-ink-400 shrink-0" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className="z-50 w-[var(--radix-popover-trigger-width)] rounded-lg border border-border bg-surface shadow-lg"
          onOpenAutoFocus={(e) => { e.preventDefault(); inputRef.current?.focus() }}
        >
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-3.5 w-3.5 text-ink-400 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-ink-400"
            />
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-400" />}
          </div>
          <div className="max-h-60 overflow-y-auto scrollbar-thin p-1">
            {query.length < minChars ? (
              <p className="px-3 py-3 text-xs text-ink-400">Start typing to search...</p>
            ) : !loading && options.length === 0 ? (
              <p className="px-3 py-3 text-xs text-ink-400">No matches found.</p>
            ) : (
              options.map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => { onChange(opt); setOpen(false); setQuery('') }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-primary-50"
                >
                  {value?.id === opt.id && <Check className="h-3.5 w-3.5 text-primary-600 shrink-0" />}
                  <span className="min-w-0">
                    <span className="block truncate text-ink-900">{opt.label}</span>
                    {opt.subLabel && <span className="block truncate text-xs text-ink-400">{opt.subLabel}</span>}
                  </span>
                </button>
              ))
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
