/** Indicatore lineare determinato M3 (track + indicator con gap), colore per soglia di riempimento. */
export function CapacityGauge({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  const color = pct >= 100 ? 'bg-error' : pct >= 75 ? 'bg-warning' : 'bg-success'

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2 text-label-l text-on-surface">
        <span className="min-w-0 truncate">{label}</span>
        <span className="tabular-nums text-on-surface-variant">
          {value}/{max}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className="flex h-1 w-full gap-1"
      >
        {pct > 0 && (
          <div className={`h-full rounded-full ${color} transition-all duration-300 ease-standard`} style={{ width: `${pct}%` }} />
        )}
        {pct < 100 && <div className="h-full flex-1 rounded-full bg-surface-container-highest" />}
      </div>
    </div>
  )
}
