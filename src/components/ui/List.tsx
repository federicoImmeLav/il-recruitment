import type { ReactNode } from 'react'

/** Lista M3 con divider tra le voci. */
export function List({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <ul className={`divide-y divide-outline-variant ${className}`}>{children}</ul>
}

interface ListItemProps {
  headline: ReactNode
  supporting?: ReactNode
  /** Riga sopra l'headline (overline M3). */
  overline?: ReactNode
  leading?: ReactNode
  trailing?: ReactNode
  /** Rende l'intera voce cliccabile (state layer). */
  onClick?: () => void
  className?: string
}

/** Voce di lista M3: 56dp (una riga), 72dp (due righe), più alta se il contenuto lo richiede. */
export function ListItem({ headline, supporting, overline, leading, trailing, onClick, className = '' }: ListItemProps) {
  const corpo = (
    <>
      {leading && <div className="flex shrink-0 items-center">{leading}</div>}
      <div className="min-w-0 flex-1">
        {overline && <div className="text-label-m text-on-surface-variant">{overline}</div>}
        <div className="text-body-l text-on-surface">{headline}</div>
        {supporting && <div className="text-body-m text-on-surface-variant">{supporting}</div>}
      </div>
      {trailing && <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{trailing}</div>}
    </>
  )
  const base = `flex items-center gap-4 py-2 text-left ${supporting ? 'min-h-18' : 'min-h-14'}`
  return (
    <li className={className}>
      {onClick ? (
        // Il velo dello state layer sborda di 8px per lato, il testo resta allineato al resto.
        <button type="button" onClick={onClick} className={`state-layer ${base} -mx-2 w-[calc(100%+1rem)] rounded-sm px-2`}>
          {corpo}
        </button>
      ) : (
        <div className={`${base} w-full`}>{corpo}</div>
      )}
    </li>
  )
}
