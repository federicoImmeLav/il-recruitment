import { useEffect, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { ErrorBanner } from '../../../components/ui/Spinner'
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
  openDayId: string | undefined
  selezionato: KioskDatiIscritto | null
  onSeleziona: (dati: KioskDatiIscritto | null) => void
  onAvanti: () => void
}

export function StepIdentificazione({ openDayId, selezionato, onSeleziona, onAvanti }: Props) {
  const [query, setQuery] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [errore, setErrore] = useState<string | null>(null)
  const debounced = useDebounced(query)
  const ricerca = useKioskCercaIscritti(openDayId, debounced)
  const mostraRisultati = !selezionato && debounced.trim().length >= 2 && !!openDayId

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
        <div className="flex gap-2 rounded-md border-l-4 border-blue bg-blue-light px-4 py-3 text-sm text-blue-dark">
          <span aria-hidden>✅</span>
          <span>
            <strong>
              {selezionato.cognome} {selezionato.nome}
              {selezionato.scuola ? ` — ${selezionato.scuola}` : ''}
            </strong>{' '}
            — dati trovati. Puoi procedere o modificarli nei passi successivi.
          </span>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button type="button" variant="ghost" onClick={reset}>
            ← Cerca altro nominativo
          </Button>
          <Button type="button" variant="blue" onClick={onAvanti}>
            Avanti →
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {openDayId ? (
        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digita il cognome dell'allievo…"
            autoComplete="off"
            autoFocus
            className="w-full rounded-il border-2 border-blue px-4 py-4 text-lg focus:outline-none focus:ring-4 focus:ring-blue/15 sm:text-xl"
          />
          {mostraRisultati && (
            <div className="mt-1 overflow-hidden rounded-il border border-border bg-white shadow-il">
              {ricerca.isLoading && <p className="px-4 py-3 text-sm text-text3">Ricerca in corso…</p>}
              {ricerca.data?.length === 0 && (
                <p className="px-4 py-3 text-sm text-text2">
                  Nessun risultato per “{debounced.trim()}”. Controlla il cognome oppure compila il modulo a mano.
                </p>
              )}
              {ricerca.data?.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={loadingId !== null}
                  onClick={() => void scegli(p)}
                  className="block w-full border-b border-border px-4 py-3 text-left last:border-b-0 hover:bg-blue-light disabled:opacity-60"
                >
                  <span className="block text-base font-bold text-text">
                    {p.cognome} {p.nome}
                  </span>
                  <span className="block text-sm text-text3">
                    {loadingId === p.id ? 'Caricamento…' : p.scuola || '—'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="rounded-md border-l-4 border-orange bg-orange-light px-4 py-3 text-sm text-orange-dark">
          Nessun Open Day in corso oggi: la ricerca delle registrazioni non è disponibile. Compila il modulo a mano.
        </p>
      )}

      {(errore || ricerca.error) && (
        <ErrorBanner message={errore ?? 'Ricerca non disponibile al momento. Puoi compilare il modulo a mano.'} />
      )}

      <div className="rounded-il border-[1.5px] border-[#f4d03f] bg-[#fff8e1] p-4">
        <p className="text-sm font-bold text-[#8a6d00]">Non sei registrato all'Open Day o non trovi il nominativo?</p>
        <p className="mt-1 text-sm text-text2">Nessun problema: compila tutti i dati nei passi successivi.</p>
        <Button type="button" variant="ghost" className="mt-3 bg-white" onClick={onAvanti}>
          Compila senza registrazione →
        </Button>
      </div>
    </div>
  )
}
