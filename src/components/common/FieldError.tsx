export function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="mt-1 rounded-md border border-danger-500/30 bg-danger-50 px-2.5 py-1.5 text-xs text-danger-600">
      {message}
    </p>
  )
}