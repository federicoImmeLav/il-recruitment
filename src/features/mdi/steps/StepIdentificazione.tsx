import { useEffect, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { ErrorBanner, InfoBanner } from '../../../components/ui/Spinner'
import { Icon } from '../../../components/ui/Icon'
import { fetchKioskDatiIscritto, useKioskCercaIscritti } from '../../../hooks/useMdi'
import type { KioskDatiIscritto, KioskIscritto } from '../../../types/database.types'

function useDebounced(value: string, ms = 250) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}

interface Props {
  selezionato: KioskDatiIscritto | null
  onSeleziona: (dati: KioskDatiIscritto | null) => void
  onAvanti: () => void
}

function dataOpenDay(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'long' })
}

export function StepIdentificazione({ selezionato, onSeleziona, onAvanti }: Props) {
  const [query, setQuery] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [errore, setErrore] = useState<string | null>(null)
  const debounced = useDebounced(query)
  const ricerca = useKioskCercaIscritti(debounced)
  const mostraRisultati = !selezionato && debounced.trim().length >= 2

  async function scegli(iscritto: KioskIscritto) {
    setErrore(null)
    setLoadingId(iscritto.id)
    try {
      const dati = await fetchKioskDatiIscritto(iscritto.id)
      if (!dati) throw new Error('non trovato')
      onSeleziona(dati)
    } catch {
      setErrore('Impossibile recuperare i dati della registrazione. Puoi comunque compilare il modulo a mano.')
    } finally {
      setLoadingId(null)
    }
  }

  function reset() {
    onSeleziona(null)
    setQuery('')
  }

  if (selezionato) {
    return (
      <div className="space-y-4">
        <InfoBanner tone="tertiary" icon="check_circle" className="!text-body-l">
          <strong>
            {selezionato.cognome} {selezionato.nome}
            {selezionato.scuola ? ` — ${selezionato.scuola}` : ''}
          </strong>{' '}
          — dati trovati. Puoi procedere o modificarli nei passi successivi.
        </InfoBanner>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button size="lg" variant="outlined" icon="search" onClick={reset}>
            Cerca altro nominativo
          </Button>
          <Button size="lg" trailingIcon="arrow_forward" onClick={onAvanti}>
            Avanti
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        {/* Search bar M3, grande per il touch del kiosk */}
        <label className="flex h-16 items-center gap-4 rounded-full bg-surface-container-highest px-5 text-on-surface-variant focus-within:outline-3 focus-within:outline-primary sm:h-18">
          <Icon name="search" size={28} />
          <input
            type="search"
            aria-label="Cerca l'allievo per cognome o nome"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digita il cognome o il nome dell'allievo…"
            autoComplete="off"
            autoFocus
            className="h-full min-w-0 flex-1 bg-transparent text-body-l text-on-surface outline-none placeholder:text-on-surface-variant sm:text-title-l sm:font-normal"
          />
        </label>
        {mostraRisultati && (
          <div className="mt-2 overflow-hidden rounded-lg bg-surface-container py-2 shadow-elev-2">
            {ricerca.isLoading && <p className="px-4 py-3 text-body-m text-on-surface-variant">Ricerca in corso…</p>}
            {ricerca.data?.length === 0 && (
              <p className="px-4 py-3 text-body-m text-on-surface-variant">
                Nessun iscritto trovato per “{debounced.trim()}”. Controlla come l’hai scritto oppure compila il
                modulo a mano.
              </p>
            )}
            {ricerca.data?.map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={loadingId !== null}
                onClick={() => void scegli(p)}
                className="state-layer flex min-h-18 w-full items-center gap-4 px-4 py-2 text-left disabled:opacity-60"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-title-m text-on-primary-container">
                  {p.cognome.charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                <span className="block text-title-m text-on-surface">
                  {p.cognome} {p.nome}
                </span>
                <span className="block text-body-m text-on-surface-variant">
                  {loadingId === p.id
                    ? 'Caricamento…'
                    : `${p.scuola || 'Scuola non indicata'} · Open Day ${dataOpenDay(p.open_day_data)}`}
                </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {(errore || ricerca.error) && (
        <ErrorBanner message={errore ?? 'Ricerca non disponibile al momento. Puoi compilare il modulo a mano.'} />
      )}

      <div className="rounded-lg bg-warning-container p-5 text-on-warning-container">
        <p className="flex items-center gap-2 text-title-m">
          <Icon name="person_search" />
          Non sei registrato all'Open Day o non trovi il nominativo?
        </p>
        <p className="mt-1 text-body-l">Nessun problema: compila tutti i dati nei passi successivi.</p>
        <Button size="lg" variant="elevated" trailingIcon="arrow_forward" className="mt-4" onClick={onAvanti}>
          Compila senza registrazione
        </Button>
      </div>

    </div>
  )
}
