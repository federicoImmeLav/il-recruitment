import { useId, useState, type ReactNode } from 'react'
import { FieldShell } from './Field'
import { fieldAria, fieldInputClass } from './fieldUtils'

interface AutocompleteProps<T> {
  label: string
  required?: boolean
  error?: string
  hint?: ReactNode
  placeholder?: string
  /** Testo mostrato nel campo (controllato dal chiamante). */
  value: string
  /** Suggerimenti per il testo digitato (gia' filtrati e limitati). */
  suggerimenti: (testo: string) => T[]
  chiave: (item: T) => string
  renderItem: (item: T) => ReactNode
  /** L'utente digita: il valore scelto in precedenza va considerato annullato. */
  onTesto: (testo: string) => void
  onScegli: (item: T) => void
  onBlur?: () => void
  caricamento?: boolean
  vuoto?: ReactNode
}

/** Campo di testo con elenco di suggerimenti (tastiera: frecce, Invio, Esc; touch friendly). */
export function Autocomplete<T>({
  label,
  required,
  error,
  hint,
  placeholder,
  value,
  suggerimenti,
  chiave,
  renderItem,
  onTesto,
  onScegli,
  onBlur,
  caricamento,
  vuoto,
}: AutocompleteProps<T>) {
  const id = useId()
  const [aperto, setAperto] = useState(false)
  const [attivo, setAttivo] = useState(0)
  const items = aperto ? suggerimenti(value) : []
  const mostraLista = aperto && value.trim().length >= 2

  function scegli(item: T) {
    onScegli(item)
    setAperto(false)
  }

  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      error={error}
      hint={hint}
      alwaysFloat={!!placeholder}
      trailing={
        mostraLista && (
          <ul
            id={`${id}-lista`}
            role="listbox"
            className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-xs bg-surface-container py-2 shadow-elev-2"
          >
            {caricamento && <li className="px-4 py-3 text-body-m text-on-surface-variant">Caricamento elenco…</li>}
            {!caricamento && items.length === 0 && (
              <li className="px-4 py-3 text-body-m text-on-surface-variant">{vuoto ?? 'Nessun risultato'}</li>
            )}
            {items.map((item, i) => (
              <li
                key={chiave(item)}
                role="option"
                aria-selected={i === attivo}
                onMouseDown={(e) => {
                  e.preventDefault()
                  scegli(item)
                }}
                onMouseEnter={() => setAttivo(i)}
                className={`flex min-h-12 cursor-pointer items-center px-4 py-2 text-body-l text-on-surface ${
                  i === attivo ? 'bg-on-surface/8' : ''
                }`}
              >
                {renderItem(item)}
              </li>
            ))}
          </ul>
        )
      }
    >
      <input
        id={id}
        {...fieldAria(id, error)}
        role="combobox"
        aria-expanded={mostraLista}
        aria-controls={`${id}-lista`}
        aria-autocomplete="list"
        autoComplete="off"
        value={value}
        placeholder={placeholder ?? ' '}
        onChange={(e) => {
          onTesto(e.target.value)
          setAperto(true)
          setAttivo(0)
        }}
        onFocus={() => setAperto(true)}
        onBlur={() => {
          // Ritardo: lascia arrivare il click/tap sul suggerimento.
          setTimeout(() => setAperto(false), 150)
          onBlur?.()
        }}
        onKeyDown={(e) => {
          if (!mostraLista || items.length === 0) return
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setAttivo((a) => Math.min(a + 1, items.length - 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setAttivo((a) => Math.max(a - 1, 0))
          } else if (e.key === 'Enter') {
            e.preventDefault()
            scegli(items[attivo])
          } else if (e.key === 'Escape') {
            setAperto(false)
          }
        }}
        className={fieldInputClass()}
      />
    </FieldShell>
  )
}
