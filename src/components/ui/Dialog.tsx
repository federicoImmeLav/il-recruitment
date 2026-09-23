import { useEffect, useId, useRef, type ReactNode } from 'react'
import { IconButton } from './Button'

/**
 * Dialog M3 su `<dialog>` nativo (`showModal`: focus trap, Esc, inert sul resto della pagina).
 * - `basic`: dialog centrato (form brevi, conferme).
 * - `form`: full-screen su compact (< 600dp), dialog centrato più largo altrove (form lunghi).
 * - `sheet`: full-screen su compact, side sheet a destra altrove (dettagli consultativi).
 * Va montato solo quando è aperto: la chiusura la decide il chiamante con `onClose`.
 * Il click sullo scrim non chiude, per non perdere dati inseriti per sbaglio.
 */
export function Dialog({
  title,
  onClose,
  children,
  footer,
  variant = 'basic',
}: {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  variant?: 'basic' | 'form' | 'sheet'
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    const prima = document.activeElement as HTMLElement | null
    if (dialog && !dialog.open) {
      dialog.showModal()
      // Focus iniziale M3: primo campo del contenuto, altrimenti il dialog stesso (non il pulsante Chiudi).
      const campo = dialog.querySelector<HTMLElement>('[data-dialog-body] :is(input, select, textarea):not([disabled])')
      ;(campo ?? dialog).focus()
    }
    return () => {
      dialog?.close()
      prima?.focus?.()
    }
  }, [])

  const forma = {
    basic: 'm-auto w-[min(560px,calc(100vw-48px))] max-h-[calc(100dvh-48px)] rounded-xl',
    form: 'm-0 h-dvh max-h-none w-screen max-w-none medium:m-auto medium:h-auto medium:max-h-[calc(100dvh-48px)] medium:w-[min(640px,calc(100vw-48px))] medium:rounded-xl',
    sheet: 'm-0 h-dvh max-h-none w-screen max-w-none medium:ml-auto medium:w-[min(480px,100vw)] medium:rounded-l-lg',
  }[variant]

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      tabIndex={-1}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      className={`flex-col overflow-hidden border-0 bg-surface-container-high p-0 text-on-surface shadow-elev-3 outline-none open:flex ${forma}`}
    >
      <div className={`flex shrink-0 items-center gap-2 ${variant === 'basic' ? 'px-6 pt-6 pb-4' : 'py-3 pl-6 pr-3'}`}>
        <h2 id={titleId} className={`min-w-0 flex-1 ${variant === 'basic' ? 'text-headline-s' : 'text-title-l'}`}>
          {title}
        </h2>
        <IconButton icon="close" label="Chiudi" onClick={onClose} />
      </div>
      <div data-dialog-body className="min-h-0 flex-1 overflow-y-auto px-6 pt-2 pb-4 text-body-m text-on-surface-variant">{children}</div>
      {footer && (
        <div
          className={`flex shrink-0 flex-wrap items-center justify-end gap-2 px-6 pt-2 pb-6 ${variant !== 'basic' ? 'border-t border-outline-variant pt-4' : ''}`}
        >
          {footer}
        </div>
      )}
    </dialog>
  )
}
