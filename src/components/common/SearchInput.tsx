import { Search } from 'lucide-react'
import { Input } from '@/components/ui/Input'

export function SearchInput({ value, onChange, placeholder = 'Search...', className }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string
}) {
  return (
    <div className={className}>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-8" />
      </div>
    </div>
  )
}
