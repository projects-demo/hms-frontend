export function digitsOnly(value: string, maxLength = 10): string {
  return value.replace(/\D/g, '').slice(0, maxLength)
}

export function phoneError(value: string, required = false): string | undefined {
  if (!value) return required ? 'Phone number is required.' : undefined
  if (!/^\d{10}$/.test(value)) return 'Enter exactly 10 digits.'
  return undefined
}

export function emailError(value: string, required = false): string | undefined {
  if (!value.trim()) return required ? 'Email is required.' : undefined
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Enter a valid email address.'
  return undefined
}

export function requiredError(value: string, label: string): string | undefined {
  return value.trim() ? undefined : `${label} is required.`
}

export function numberError(
  value: string,
  label: string,
  min: number,
  max?: number,
  required = false,
): string | undefined {
  if (!value.trim()) return required ? `${label} is required.` : undefined
  const number = Number(value)
  if (!Number.isFinite(number)) return `${label} must be a number.`
  if (number < min) return `${label} must be at least ${min}.`
  if (max !== undefined && number > max) return `${label} must be no more than ${max}.`
  return undefined
}

export function integerError(
  value: string,
  label: string,
  min: number,
  max?: number,
  required = false,
): string | undefined {
  if (!value.trim()) return required ? `${label} is required.` : undefined
  const number = Number(value)
  if (!Number.isInteger(number)) return `${label} must be a whole number.`
  if (number < min) return `${label} must be at least ${min}.`
  if (max !== undefined && number > max) return `${label} must be no more than ${max}.`
  return undefined
}