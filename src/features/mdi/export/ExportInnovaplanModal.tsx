import { useMemo, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { InputField, SelectField } from '../../../components/ui/Field'
import { Modal } from '../../../components/ui/Modal'
import { ErrorBanner, Spinner } from '../../../components/ui/Spinner'
import { useCorsi } from '../../../hooks/useCorsi'
import { useMdiList, useSegnaEsportate } from '../../../hooks/useMdi'
import { useImpostazioni } from '../../../hooks/useNotifiche'
import { useOpenDays } from '../../../hooks/useOpenDays'
import { useAuth } from '../../auth/AuthProvider'
import { annoScolasticoIscrizione, avvisiMdi, generaCsv, nomeFile, scaricaCsv, type ContestoExport } from './innovaplanCsv'

type Selezione = 'da_esportare' | 'tutte' | `od:${string}`

/**
 * Export delle MDI nel CSV "Alunni e scelte" da importare su INNOVAPLAN.
 * Il file e' generato nel browser (lo staff legge gia' le MDI tramite RLS);
 * segnare le MDI come esportate e' un passo separato e sempre manuale.
 */
export function ExportInnovaplanModal({ onClose }: { onClose: () => void }) {
  const { profile } = useAuth()
  const { data: tutte, isLoading, error } = useMdiList({})
  const { data: corsi } = useCorsi()
  const { data: imp } = useImpostazioni()
  const { data: openDays } = useOpenDays()
  const segna = useSegnaEsportate()

  const [selezione, setSelezione] = useState<Selezione>('da_esportare')
  const [anno, setAnno] = useState(annoScolasticoIscrizione())
  const [scaricate, setScaricate] = useState<string[] | null>(null)
  const [segnate, setSegnate] = useState(false)

  const righe = useMemo(() => {
    const lista = tutte ?? []
    if (selezione === 'da_esportare') return lista.filter((m) => !m.esportato_innovaplan)
    if (selezione === 'tutte') return lista
    return lista.filter((m) => m.open_day_id === selezione.slice(3))
  }, [tutte, selezione])

  const ctx: ContestoExport | null =
    imp && corsi
      ? {
          annoScolastico: anno,
          codiceSede: imp.codice_meccanografico_sede,
          classificazione: imp.classificazione_ministeriale,
          corsi,
        }
      : null

  const incomplete = ctx
    ? righe.map((m) => ({ m, avvisi: avvisiMdi(m, ctx) })).filter((x) => x.avvisi.length > 0)
    : []
  const corsiSenzaCodice = corsi?.filter((c) => !c.codice_ministeriale) ?? []

  function scarica() {
    if (!ctx || righe.length === 0) return
    scaricaCsv(generaCsv(righe, ctx), nomeFile(ctx))
    setScaricate(righe.map((m) => m.id))
    setSegnate(false)
  }

  async function segnaEsportate() {
    if (!scaricate || !profile) return
    await segna.mutateAsync({ ids: scaricate, staffId: profile.id })
    setSegnate(true)
  }

  const daSegnare = scaricate?.length ?? 0

  return (
    <Modal
      title="Esporta per INNOVAPLAN"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Chiudi
          </Button>
          <Button variant="blue" disabled={!ctx || righe.length === 0} onClick={scarica}>
            ⬇ Scarica CSV ({righe.length})
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <p className="text-text2">
          Genera il file nel formato <strong>“Alunni e scelte”</strong> (stesse colonne dell’export SIDI) da caricare su
          INNOVAPLAN per creare l’anagrafica.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SelectField
            label="Quali MDI"
            value={selezione}
            onChange={(e) => {
              setSelezione(e.target.value as Selezione)
              setScaricate(null)
            }}
          >
            <option value="da_esportare">Solo quelle non ancora esportate</option>
            <option value="tutte">Tutte</option>
            {openDays?.map((od) => (
              <option key={od.id} value={`od:${od.id}`}>
                Open Day {new Date(od.data).toLocaleDateString('it-IT')} · {od.ora.slice(0, 5)}
              </option>
            ))}
          </SelectField>
          <InputField
            label="Anno scolastico (inizio)"
            type="number"
            min={2020}
            max={2100}
            value={anno}
            onChange={(e) => setAnno(Number(e.target.value))}
            hint={
              <p className="mt-1 text-xs text-text3">
                Iscrizione per il {anno}/{String((anno + 1) % 100).padStart(2, '0')}
              </p>
            }
          />
        </div>

        {isLoading && <Spinner />}
        {error && <ErrorBanner message="Errore nel caricamento delle MDI." />}

        {corsiSenzaCodice.length > 0 && (
          <div className="rounded-il border-l-4 border-orange bg-orange-light px-3 py-2 text-orange-dark">
            Manca il codice ministeriale per: {corsiSenzaCodice.map((c) => c.nome).join(', ')}. Impostalo in{' '}
            <strong>Impostazioni → Dati per INNOVAPLAN</strong>, altrimenti le colonne dell’indirizzo resteranno vuote.
          </div>
        )}

        {righe.length === 0 && !isLoading && <p className="text-text3">Nessuna MDI da esportare con questa scelta.</p>}

        {incomplete.length > 0 && (
          <details className="rounded-il border border-border bg-gray-xlight px-3 py-2">
            <summary className="cursor-pointer font-bold text-text2">
              ⚠ {incomplete.length} MDI con dati mancanti (verranno esportate comunque)
            </summary>
            <ul className="mt-2 space-y-1.5 text-xs">
              {incomplete.map(({ m, avvisi }) => (
                <li key={m.id}>
                  <strong>
                    {m.all_cognome} {m.all_nome}
                  </strong>
                  : {avvisi.join(', ')}
                </li>
              ))}
            </ul>
          </details>
        )}

        {scaricate && (
          <div className="space-y-2 rounded-il border border-border p-3">
            <p className="text-text2">
              File scaricato con <strong>{daSegnare}</strong> MDI. Dopo averlo importato su INNOVAPLAN, segnale come
              esportate:
            </p>
            {segnate ? (
              <p className="font-bold text-green">✓ {daSegnare} MDI segnate come esportate su INNOVAPLAN</p>
            ) : (
              <Button variant="success" disabled={segna.isPending || !profile} onClick={() => void segnaEsportate()}>
                {segna.isPending ? 'Salvataggio…' : `Segna ${daSegnare} MDI come esportate su INNOVAPLAN`}
              </Button>
            )}
            {segna.error && <ErrorBanner message="Aggiornamento non riuscito, riprova." />}
          </div>
        )}
      </div>
    </Modal>
  )
}
