import type { ReactNode } from 'react'

export function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-lg rounded-il bg-white shadow-il">
        <div className="flex items-center justify-between border-b-4 border-orange px-5 py-4">
          <h2 className="text-base font-bold text-text">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="text-xl leading-none text-text3 hover:text-text"
          >
            &times;
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-border px-5 py-4">{footer}</div>}
      </div>
    </div>
  )
}
