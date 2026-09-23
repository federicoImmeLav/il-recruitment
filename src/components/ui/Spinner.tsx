import type { ReactNode } from 'react'
import { Icon } from './Icon'

/** Indicatore di avanzamento circolare indeterminato M3. */
export function Spinner({ label = 'Caricamento…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 py-8 text-body-m text-on-surface-variant">
      <svg className="h-6 w-6 animate-spin text-primary" viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="44 63" />
      </svg>
      {label}
    </div>
  )
}

/** Messaggio di errore: contenitore error-container con icona. */
export function ErrorBanner({ message }: { message: ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-md bg-error-container px-4 py-3 text-body-m text-on-error-container">
      <Icon name="error" size={20} className="mt-px" />
      <div className="min-w-0 flex-1">{message}</div>
    </div>
  )
}

/** Riquadro informativo/avviso (stessa forma di ErrorBanner, colori diversi). */
export function InfoBanner({
  tone = 'neutral',
  icon = 'info',
  children,
  className = '',
}: {
  tone?: 'neutral' | 'warning' | 'tertiary' | 'success'
  icon?: string
  children: ReactNode
  className?: string
}) {
  const colori = {
    neutral: 'bg-surface-container-high text-on-surface-variant',
    warning: 'bg-warning-container text-on-warning-container',
    tertiary: 'bg-tertiary-container text-on-tertiary-container',
    success: 'bg-success-container text-on-success-container',
  }[tone]
  return (
    <div className={`flex items-start gap-3 rounded-md px-4 py-3 text-body-m ${colori} ${className}`}>
      <Icon name={icon} size={20} className="mt-px" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
