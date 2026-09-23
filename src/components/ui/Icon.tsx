/**
 * Icona Material Symbols Rounded (font caricato in index.html, sottoinsieme `icon_names`:
 * se si usa un'icona nuova va aggiunta anche lì, in ordine alfabetico).
 * Decorativa di default; passare `label` se l'icona porta da sola un significato.
 */
export function Icon({
  name,
  size = 24,
  filled,
  label,
  className = '',
}: {
  name: string
  size?: number
  filled?: boolean
  label?: string
  className?: string
}) {
  return (
    <span
      className={`material-symbols-rounded inline-block shrink-0 leading-none ${filled ? 'icon-filled' : ''} ${className}`}
      style={{ fontSize: size, width: size, height: size }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {name}
    </span>
  )
}
