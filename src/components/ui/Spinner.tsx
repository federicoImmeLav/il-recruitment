export function Spinner({ label = 'Caricamento…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-8 text-sm text-text3">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-orange" />
      {label}
    </div>
  )
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-il border border-red/30 bg-red-light px-4 py-3 text-sm text-red-dark">
      {message}
    </div>
  )
}
