import { useState, type InputHTMLAttributes, type ReactNode } from 'react'
import type { FieldError } from 'react-hook-form'

/** Sezione con intestazione grigia (".fs/.fsh" del vecchio kiosk). */
export function KioskSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-il border border-border bg-white">
      <h2 className="border-b border-border bg-gray-xlight px-4 py-3 text-xs font-black uppercase tracking-wide text-text2 sm:px-5">
        {title}
      </h2>
      <div className="space-y-4 p-4 sm:p-5">{children}</div>
    </section>
  )
}

export function PrefillBadge({ show, label = 'precompilato' }: { show: boolean; label?: string }) {
  if (!show) return null
  return (
    <span className="mt-1 inline-block rounded-full bg-blue-light px-2 py-0.5 text-[10px] font-bold text-blue">
      ● {label}
    </span>
  )
}

/** Opzione a card (radio o checkbox), grande per il touch. */
export function ChoiceItem({
  label,
  type = 'checkbox',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; type?: 'checkbox' | 'radio' }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-il border-[1.5px] border-border px-4 py-3 text-sm transition-colors hover:border-blue has-[:checked]:border-blue has-[:checked]:bg-blue-light">
      <input type={type} className="h-5 w-5 shrink-0 accent-blue" {...props} />
      <span className="flex-1">{label}</span>
    </label>
  )
}

/** Riga consenso con pulsanti SÌ / NO (radio con valori 'si' | 'no'). */
export function SiNoField({
  children,
  error,
  inputProps,
}: {
  children: ReactNode
  error?: FieldError
  inputProps: InputHTMLAttributes<HTMLInputElement>
}) {
  const btn =
    'cursor-pointer rounded-md border-[1.5px] border-border bg-white px-4 py-1.5 text-sm font-bold transition-colors'
  return (
    <div
      className={`rounded-il border-[1.5px] px-4 py-3 ${error ? 'border-red bg-red-light/40' : 'border-border'}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1 text-sm leading-relaxed">{children}</div>
        <div className="flex shrink-0 gap-2">
          <label
            className={`${btn} has-[:checked]:border-green has-[:checked]:bg-green-light has-[:checked]:text-green`}
          >
            <input type="radio" value="si" className="sr-only" {...inputProps} />
            SÌ
          </label>
          <label className={`${btn} has-[:checked]:border-red has-[:checked]:bg-red-light has-[:checked]:text-red`}>
            <input type="radio" value="no" className="sr-only" {...inputProps} />
            NO
          </label>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-red">{error.message}</p>}
    </div>
  )
}

export function Accordion({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="overflow-hidden rounded-il border border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 bg-gray-xlight px-4 py-3 text-left text-sm font-bold text-text2 hover:bg-gray-light"
      >
        <span>{title}</span>
        <span aria-hidden>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="space-y-3 bg-white px-4 py-4 text-xs leading-relaxed text-text2">{children}</div>}
    </div>
  )
}

/** Riga "Milano, il ____  Firma ____" mostrata a video come promemoria della firma su carta. */
export function FirmaPromemoria({ nome }: { nome: string }) {
  return (
    <div className="flex flex-wrap items-end gap-4 border-t border-border pt-4 text-xs text-text3">
      <div className="min-w-[180px] flex-1 text-sm text-text2">
        Il/la sottoscritto/a <strong className="text-text">{nome || '—'}</strong>
      </div>
      <div className="min-w-[200px] flex-1 text-center">
        <span className="font-bold uppercase tracking-wide">Firma leggibile del genitore</span>
        <div className="mt-1 h-8 border-b-[1.5px] border-border-dark" />
        <span className="mt-1 block">(sulla copia stampata)</span>
      </div>
    </div>
  )
}
