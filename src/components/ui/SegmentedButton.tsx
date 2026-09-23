import type { InputHTMLAttributes, ReactNode } from 'react'
import { Icon } from './Icon'

/**
 * Segmented button M3 a scelta singola, costruito su radio veri (compatibile con
 * `register()` di React Hook Form): il gruppo dà il bordo, ogni opzione è un segmento.
 */
export function SegmentedGroup({
  label,
  children,
  className = '',
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`inline-flex divide-x divide-outline overflow-hidden rounded-full border border-outline ${className}`}
    >
      {children}
    </div>
  )
}

export function SegmentedOption({
  label,
  size = 'md',
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & { label: ReactNode; size?: 'md' | 'lg' }) {
  return (
    <label
      className={`state-layer flex min-w-16 flex-1 cursor-pointer items-center justify-center gap-2 text-label-l text-on-surface has-[:checked]:bg-secondary-container has-[:checked]:text-on-secondary-container has-[:focus-visible]:outline-3 has-[:focus-visible]:-outline-offset-3 has-[:focus-visible]:outline-secondary ${
        size === 'lg' ? 'h-12 px-6 text-title-s' : 'h-10 px-4'
      }`}
    >
      <input type="radio" className="peer sr-only" {...props} />
      <Icon name="check" size={18} className="hidden peer-checked:inline-block" />
      {label}
    </label>
  )
}
