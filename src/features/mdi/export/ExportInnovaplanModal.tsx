import { useMemo, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { InputField, SelectField } from '../../../components/ui/Field'
import { Dialog } from '../../../components/ui/Dialog'
import { ErrorBanner, InfoBanner, Spinner } from '../../../components/ui/Spinner'
import { Icon } from '../../../components/ui/Icon'
import { useSnackbar } from '../../../components/ui/Snackbar'
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
  const snackbar = useSnackbar()

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
    snackbar(`${scaricate.length} MDI segnate come esportate su INNOVAPLAN`)
  }

  const daSegnare = scaricate?.length ?? 0

  return (
    <Dialog
      title="Esporta per INNOVAPLAN"
      variant="form"
      onClose={onClose}
      footer={
        <>
          <Button variant="text" onClick={onClose}>
            Chiudi
          </Button>
          <Button icon="download" disabled={!ctx || righe.length === 0} onClick={scarica}>
            Scarica CSV ({righe.length})
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p>
          Genera il file nel formato <strong>“Alunni e scelte”</strong> (stesse colonne dell’export SIDI) da caricare su
          INNOVAPLAN per creare l’anagrafica.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            supporting={`Iscrizione per il ${anno}/${String((anno + 1) % 100).padStart(2, '0')}`}
          />
        </div>

        {isLoading && <Spinner />}
        {error && <ErrorBanner message="Errore nel caricamento delle MDI." />}

        {corsiSenzaCodice.length > 0 && (
          <InfoBanner tone="warning" icon="warning">
            Manca il codice ministeriale per: {corsiSenzaCodice.map((c) => c.nome).join(', ')}. Impostalo in{' '}
            <strong>Impostazioni → Dati per INNOVAPLAN</strong>, altrimenti le colonne dell’indirizzo resteranno vuote.
          </InfoBanner>
        )}

        {righe.length === 0 && !isLoading && <p>Nessuna MDI da esportare con questa scelta.</p>}

        {incomplete.length > 0 && (
          <details className="group rounded-md bg-surface-container-lowest">
            <summary className="state-layer flex min-h-12 cursor-pointer list-none items-center gap-3 rounded-md px-4 py-2 text-label-l text-on-surface">
              <Icon name="warning" className="text-warning" />
              <span className="flex-1">{incomplete.length} MDI con dati mancanti (verranno esportate comunque)</span>
              <Icon name="expand_more" className="transition-transform group-open:rotate-180" />
            </summary>
            <ul className="space-y-1.5 px-4 pb-3 text-body-s">
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
          <div className="space-y-3 rounded-md bg-surface-container-lowest p-4">
            <p>
              File scaricato con <strong>{daSegnare}</strong> MDI. Dopo averlo importato su INNOVAPLAN, segnale come
              esportate:
            </p>
            {segnate ? (
              <p className="flex items-center gap-2 text-label-l text-success">
                <Icon name="check_circle" filled size={20} />
                {daSegnare} MDI segnate come esportate su INNOVAPLAN
              </p>
            ) : (
              <Button variant="success" icon="done_all" disabled={segna.isPending || !profile} onClick={() => void segnaEsportate()}>

                {segna.isPending ? 'Salvataggio…' : `Segna ${daSegnare} MDI come esportate su INNOVAPLAN`}
              </Button>
            )}
            {segna.error && <ErrorBanner message="Aggiornamento non riuscito, riprova." />}
          </div>
        )}
      </div>
    </Dialog>
  )
}
