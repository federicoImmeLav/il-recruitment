import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import type { FieldError } from 'react-hook-form'
import { Icon } from '../../components/ui/Icon'
import { SegmentedGroup, SegmentedOption } from '../../components/ui/SegmentedButton'

/** Sezione del kiosk: card con titolo (".fs/.fsh" del vecchio kiosk). */
export function KioskSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-outline-variant bg-surface-container-lowest">
      <h2 className="px-4 pt-5 text-title-l text-on-surface sm:px-6">{title}</h2>
      <div className="space-y-5 p-4 pt-4 sm:p-6 sm:pt-4">{children}</div>
    </section>
  )
}

export function PrefillBadge({ show, label = 'precompilato' }: { show: boolean; label?: string }) {
  if (!show) return null
  return (
    <span className="ml-4 mt-1 inline-flex h-6 items-center gap-1 rounded-sm bg-tertiary-container px-2 text-label-s text-on-tertiary-container">
      <Icon name="auto_awesome" size={14} />
      {label}
    </span>
  )
}

/** Opzione a card selezionabile (radio o checkbox), almeno 56dp per il touch. */
export function ChoiceItem({
  label,
  type = 'checkbox',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; type?: 'checkbox' | 'radio' }) {
  return (
    <label className="state-layer flex min-h-14 cursor-pointer items-center gap-3 rounded-md border border-outline-variant px-4 py-2 text-body-l text-on-surface transition-colors has-[:checked]:border-transparent has-[:checked]:bg-secondary-container has-[:checked]:text-on-secondary-container has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-secondary">
      <input type={type} className="h-5 w-5 shrink-0 cursor-pointer accent-primary" {...props} />
      <span className="flex-1">{label}</span>
    </label>
  )
}

/** Riga consenso con segmented button SÌ / NO (radio con valori 'si' | 'no'). */
export function SiNoField({
  children,
  error,
  inputProps,
}: {
  children: ReactNode
  error?: FieldError
  inputProps: InputHTMLAttributes<HTMLInputElement>
}) {
  return (
    <div
      className={`rounded-md border px-4 py-4 ${error ? 'border-error bg-error-container/40' : 'border-outline-variant'}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1 text-body-l text-on-surface">{children}</div>
        <SegmentedGroup label="Consenso" className="shrink-0 self-start sm:self-center">
          <SegmentedOption value="si" label="SÌ" {...inputProps} size="lg" />
          <SegmentedOption value="no" label="NO" {...inputProps} size="lg" />
        </SegmentedGroup>
      </div>
      {error && (
        <p className="mt-2 flex items-center gap-1 text-body-s text-error">
          <Icon name="error" size={16} filled />
          {error.message}
        </p>
      )}
    </div>
  )
}

/** Pannello espandibile (testi delle informative). */
export function Accordion({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <div className="overflow-hidden rounded-md bg-surface-container">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="state-layer flex min-h-14 w-full items-center justify-between gap-3 px-4 py-2 text-left text-title-s text-on-surface"
      >
        <span>{title}</span>
        <Icon name="expand_more" className={`transition-transform duration-300 ease-standard ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div id={id} className="space-y-3 bg-surface-container-lowest px-4 py-4 text-body-m text-on-surface-variant">
          {children}
        </div>
      )}
    </div>
  )
}

/** Riga "Milano, il ____  Firma ____" mostrata a video come promemoria della firma su carta. */
export function FirmaPromemoria({ nome }: { nome: string }) {
  return (
    <div className="flex flex-wrap items-end gap-4 border-t border-outline-variant pt-4 text-body-s text-on-surface-variant">
      <div className="min-w-[180px] flex-1 text-body-m">
        Il/la sottoscritto/a <strong className="text-on-surface">{nome || '—'}</strong>
      </div>
      <div className="min-w-[200px] flex-1 text-center">
        <span className="text-label-m">Firma leggibile del genitore</span>
        <div className="mt-1 h-8 border-b border-outline" />
        <span className="mt-1 block">(sulla copia stampata)</span>
      </div>
    </div>
  )
}
