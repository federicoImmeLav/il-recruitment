import { useMemo, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { InputField, SelectField } from '../../../components/ui/Field'
import { Dialog } from '../../../components/ui/Dialog'
import { ErrorBanner, InfoBanner, Spinner } from '../../../components/ui/Spinner'
import { Icon } from '../../../components/ui/Icon'
import { useSnackbar } from '../../../components/ui/Snackbar'
import { corsiDellaSede, useCorsi } from '../../../hooks/useCorsi'
import { useMdiList, useSegnaEsportate } from '../../../hooks/useMdi'
import { useOpenDays } from '../../../hooks/useOpenDays'
import { useAuth } from '../../auth/AuthProvider'
import { useSede } from '../../sedi/SedeProvider'
import { annoScolasticoIscrizione, avvisiMdi, generaCsv, nomeFile, scaricaCsv, type ContestoExport } from './innovaplanCsv'

type Selezione = 'da_esportare' | 'tutte' | `od:${string}`

/**
 * Export delle MDI nel CSV "Alunni e scelte" da importare su INNOVAPLAN.
 * Il file e' generato nel browser (lo staff legge gia' le MDI tramite RLS);
 * segnare le MDI come esportate e' un passo separato e sempre manuale.
 * Sempre per una sola sede: codice meccanografico e codici indirizzo sono della sede.
 */
export function ExportInnovaplanModal({ onClose }: { onClose: () => void }) {
  const { profile } = useAuth()
  const { sedi, tutteLeSedi, sedeId: sedeCorrente, multiSede } = useSede()
  const [sedeId, setSedeId] = useState(sedeCorrente ?? '')
  const sede = sedi.find((s) => s.id === sedeId)
  const { data: tutte, isLoading, error } = useMdiList({ sedeId: sedeId || undefined })
  const { data: tuttiICorsi } = useCorsi()
  const corsiSede = corsiDellaSede(tuttiICorsi, sedeId)
  // Preferenze 2/3 di un'altra sede: vanno nel tracciato (sotto la I scuola) solo se quella
  // sede ha lo stesso codice meccanografico, cioe' e' la stessa scuola per il SIDI.
  const corsi = tuttiICorsi?.filter((c) => {
    const s = tutteLeSedi.find((x) => x.id === c.sede_id)
    return c.sede_id === sedeId || (!!sede?.codice_meccanografico.trim() && s?.codice_meccanografico === sede.codice_meccanografico)
  })
  const { data: openDays } = useOpenDays({ sedeId: sedeId || undefined })
  const segna = useSegnaEsportate()
  const snackbar = useSnackbar()

  const [selezione, setSelezione] = useState<Selezione>('da_esportare')
  // Filtro sulla 1ª preferenza: 'tutti', '' = senza preferenza, altrimenti corso_id.
  const [corsoId, setCorsoId] = useState('tutti')
  const [anno, setAnno] = useState(annoScolasticoIscrizione())
  const [scaricate, setScaricate] = useState<string[] | null>(null)
  const [segnate, setSegnate] = useState(false)

  const righe = useMemo(() => {
    if (!sedeId) return []
    const lista = (tutte ?? []).filter((m) => corsoId === 'tutti' || (m.corso_pref1_id ?? '') === corsoId)
    if (selezione === 'da_esportare') return lista.filter((m) => !m.esportato_innovaplan)
    if (selezione === 'tutte') return lista
    return lista.filter((m) => m.open_day_id === selezione.slice(3))
  }, [tutte, selezione, corsoId, sedeId])

  const ctx: ContestoExport | null =
    sede && corsi
      ? {
          annoScolastico: anno,
          codiceSede: sede.codice_meccanografico,
          classificazione: sede.classificazione_ministeriale,
          corsi,
        }
      : null

  const incomplete = ctx
    ? righe.map((m) => ({ m, avvisi: avvisiMdi(m, ctx) })).filter((x) => x.avvisi.length > 0)
    : []
  const corsiSenzaCodice = corsiSede.filter((c) => !c.codice_ministeriale)

  function scarica() {
    if (!ctx || righe.length === 0) return
    const corso = corsoId === 'tutti' ? null : (corsiSede.find((c) => c.id === corsoId)?.nome ?? 'senza_preferenza')
    const suffisso = corso ? `_${corso.normalize('NFD').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '')}` : ''
    scaricaCsv(generaCsv(righe, ctx), nomeFile(ctx).replace(/\.csv$/, `${suffisso}.csv`))
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
          <Button
            icon="download"
            disabled={!ctx || righe.length === 0 || !sede?.codice_meccanografico.trim()}
            onClick={scarica}
          >
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

        {multiSede && (
          <SelectField
            label="Sede"
            required
            value={sedeId}
            onChange={(e) => {
              setSedeId(e.target.value)
              setSelezione('da_esportare')
              setCorsoId('tutti')
              setScaricate(null)
            }}
          >
            <option value="">Seleziona la sede da esportare…</option>
            {sedi.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </SelectField>
        )}

        {sede && !sede.codice_meccanografico.trim() && (
          <InfoBanner tone="warning" icon="warning">
            Manca il codice meccanografico della sede {sede.nome}: impostalo in{' '}
            <strong>Impostazioni → Dati per INNOVAPLAN</strong> prima di esportare.
          </InfoBanner>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          <SelectField
            label="Corso (1ª preferenza)"
            value={corsoId}
            onChange={(e) => {
              setCorsoId(e.target.value)
              setScaricate(null)
            }}
          >
            <option value="tutti">Tutti i corsi</option>
            {corsiSede.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
            <option value="">Senza preferenza</option>
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

        {sedeId && righe.length === 0 && !isLoading && <p>Nessuna MDI da esportare con questa scelta.</p>}

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
