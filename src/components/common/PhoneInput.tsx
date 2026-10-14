import { Input, type InputProps } from '@/components/ui/Input'
import { digitsOnly } from '@/lib/validation'

type PhoneInputProps = Omit<InputProps, 'type' | 'value' | 'onChange' | 'maxLength' | 'pattern' | 'inputMode'> & {
  value: string
  onChange: (value: string) => void
}

export function PhoneInput({ value, onChange, ...props }: PhoneInputProps) {
  return (
    <Input
      {...props}
      type="tel"
      inputMode="numeric"
      pattern="[0-9]{10}"
      maxLength={10}
      value={value}
      onChange={(event) => onChange(digitsOnly(event.target.value))}
    />
  )
}