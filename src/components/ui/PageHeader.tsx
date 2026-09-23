import type { ReactNode } from 'react'
import { Link, type To } from 'react-router-dom'
import { Icon } from './Icon'

/** Intestazione di pagina: titolo headline-small, sottotitolo, azioni a destra, eventuale "indietro". */
export function PageHeader({
  title,
  subtitle,
  back,
  actions,
}: {
  title: ReactNode
  subtitle?: ReactNode
  back?: { to: To; label: string }
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
      <div className="flex min-w-0 items-center gap-2">
        {back && (
          <Link
            to={back.to}
            aria-label={back.label}
            title={back.label}
            className="state-layer touch-target -ml-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-on-surface-variant"
          >
            <Icon name="arrow_back" />
          </Link>
        )}
        <div className="min-w-0">
          <h1 className="text-headline-s text-on-surface">{title}</h1>
          {subtitle && <p className="mt-0.5 text-body-m text-on-surface-variant">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/** Titolo di sezione (title-medium) con azioni opzionali. */
export function SectionHeader({
  title,
  actions,
  className = '',
}: {
  title: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={`mb-3 flex flex-wrap items-center justify-between gap-2 ${className}`}>
      <h2 className="text-title-m text-on-surface">{title}</h2>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/** Stato vuoto: icona e messaggio. */
export function EmptyState({ icon = 'inbox', children }: { icon?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-body-m text-on-surface-variant">
      <Icon name={icon} size={40} className="text-outline" />
      <div>{children}</div>
    </div>
  )
}
