export function CapacityGauge({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  const color = pct >= 100 ? 'bg-red' : pct >= 75 ? 'bg-orange' : 'bg-green'

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-bold text-text2">
        <span>{label}</span>
        <span>
          {value}/{max}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-light">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
