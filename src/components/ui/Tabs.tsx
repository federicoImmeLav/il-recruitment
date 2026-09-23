import { useRef, type KeyboardEvent } from 'react'
import { Icon } from './Icon'

interface Tab<T extends string> {
  value: T
  label: string
  icon?: string
}

/** Primary tabs M3 (indicatore sotto l'etichetta attiva, frecce sinistra/destra da tastiera). */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  className = '',
}: {
  tabs: Tab<T>[]
  value: T
  onChange: (v: T) => void
  label: string
  className?: string
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  function onKeyDown(e: KeyboardEvent, i: number) {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!dir) return
    e.preventDefault()
    const j = (i + dir + tabs.length) % tabs.length
    onChange(tabs[j].value)
    refs.current[j]?.focus()
  }

  return (
    <div role="tablist" aria-label={label} className={`flex border-b border-outline-variant ${className}`}>
      {tabs.map((t, i) => {
        const attivo = t.value === value
        return (
          <button
            key={t.value}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="tab"
            aria-selected={attivo}
            tabIndex={attivo ? 0 : -1}
            onClick={() => onChange(t.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`state-layer relative flex h-12 flex-1 items-center justify-center gap-2 px-4 text-title-s sm:flex-none ${
              attivo ? 'text-primary' : 'text-on-surface-variant'
            }`}
          >
            {t.icon && <Icon name={t.icon} size={20} />}
            {t.label}
            {attivo && <span className="absolute inset-x-2 bottom-0 h-[3px] rounded-t-full bg-primary" />}
          </button>
        )
      })}
    </div>
  )
}
