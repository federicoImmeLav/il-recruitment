import { useId, useState, type ReactNode } from 'react'

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
    <div className="relative">
      <label htmlFor={id} className="mb-1 block text-xs font-bold uppercase tracking-wide text-text2">
        {label}
        {required && <span className="text-red"> *</span>}
      </label>
      <input
        id={id}
        role="combobox"
        aria-expanded={mostraLista}
        aria-controls={`${id}-lista`}
        aria-autocomplete="list"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
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
        className="w-full rounded-il border border-border bg-white px-3 py-2 text-sm text-text focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
      />
      {mostraLista && (
        <ul
          id={`${id}-lista`}
          role="listbox"
          className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-il border border-border bg-white shadow-il"
        >
          {caricamento && <li className="px-3 py-2 text-sm text-text3">Caricamento elenco…</li>}
          {!caricamento && items.length === 0 && (
            <li className="px-3 py-2 text-sm text-text3">{vuoto ?? 'Nessun risultato'}</li>
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
              className={`cursor-pointer border-b border-border px-3 py-2.5 text-sm last:border-b-0 ${
                i === attivo ? 'bg-blue-light' : ''
              }`}
            >
              {renderItem(item)}
            </li>
          ))}
        </ul>
      )}
      {hint}
      {error && <p className="mt-1 text-xs text-red">{error}</p>}
    </div>
  )
}
