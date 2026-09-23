import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Icon } from './Icon'

/** Filter chip M3: 32dp visivi (48dp di tocco), check leading quando selezionato. */
export function FilterChip({
  selected,
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`state-layer touch-target inline-flex h-8 shrink-0 items-center gap-2 whitespace-nowrap rounded-sm text-label-l transition-colors ${
        selected
          ? 'bg-secondary-container pl-2 pr-4 text-on-secondary-container'
          : 'border border-outline px-4 text-on-surface-variant'
      } ${className}`}
      {...props}
    >
      {selected && <Icon name="check" size={18} />}
      {children}
    </button>
  )
}

/** Riga di chip: va a capo su schermi larghi, scorre in orizzontale su mobile. */
export function ChipSet({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`-mx-4 flex gap-2 overflow-x-auto px-4 py-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 ${className}`}
    >
      {children}
    </div>
  )
}
