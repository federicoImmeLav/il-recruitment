import type { HTMLAttributes } from 'react'

/** Card M3: `outlined` (default, contenuti di lavoro), `filled` (raggruppamenti secondari), `elevated`. */
type Variant = 'outlined' | 'filled' | 'elevated'

const VARIANT_CLASSES: Record<Variant, string> = {
  outlined: 'border border-outline-variant bg-surface-container-lowest',
  filled: 'bg-surface-container-highest',
  elevated: 'bg-surface-container-low shadow-elev-1',
}

export function Card({
  variant = 'outlined',
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: Variant }) {
  return <div className={`rounded-md p-4 sm:p-6 ${VARIANT_CLASSES[variant]} ${className}`} {...props} />
}
