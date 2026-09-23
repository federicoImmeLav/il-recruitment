import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { InputField, TextareaField } from '../../components/ui/Field'
import { ErrorBanner, Spinner } from '../../components/ui/Spinner'
import { useImpostazioni, useImportLog, useUpdateImpostazioni } from '../../hooks/useNotifiche'
import { useCorsi, useUpdateCodiceCorso } from '../../hooks/useCorsi'
import type { Corso } from '../../types/database.types'
import { CANALE_NOTIFICA_LABEL } from '../../lib/constants'
import { SEGNAPOSTO, componiMessaggio } from '../../lib/messaggi'
import type { CanaleNotifica, EsitoImport, Impostazioni } from '../../types/database.types'

type FormValues = Omit<Impostazioni, 'id' | 'updated_at'>

const ESEMPIO_BOOKING = { nome: 'Mario', cognome: 'Rossi' }
function esempioOpenDay() {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  return { data: d.toISOString().slice(0, 10), ora: '10:00', luogo_override: null }
}

const TESTI = [
  { campo: 'testo_approvazione', label: 'Messaggio di conferma' },
  { campo: 'testo_rifiuto', label: 'Messaggio di rifiuto' },
  { campo: 'testo_reminder', label: 'Promemoria (2 giorni prima)' },
] as const

const ESITO_BADGE: Record<EsitoImport, { color: 'green' | 'gray' | 'orange' | 'red'; label: string }> = {
  importata: { color: 'green', label: 'Importata' },
  duplicata: { color: 'gray', label: 'Già importata' },
  open_day_non_trovato: { color: 'orange', label: 'Open Day non trovato' },
  errore: { color: 'red', label: 'Errore' },
}

function CodiceCorso({ corso }: { corso: Corso }) {
  const update = useUpdateCodiceCorso()
  const [valore, setValore] = useState(corso.codice_ministeriale ?? '')
  const salvato = (corso.codice_ministeriale ?? '') === valore.trim().toUpperCase()

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <InputField
          label={corso.nome}
          placeholder="es. A199"
          maxLength={10}
          className="uppercase"
          value={valore}
          onChange={(e) => setValore(e.target.value)}
          onBlur={() => {
            if (!salvato) void update.mutateAsync({ id: corso.id, codice_ministeriale: valore.trim().toUpperCase() || null })
          }}
        />
      </div>
      <span className="pb-2 text-xs">
        {update.isPending ? '…' : update.error ? <span className="text-red">errore</span> : salvato && valore ? <span className="text-green">✓</span> : null}
      </span>
    </div>
  )
}

function CodiciCorsi() {
  const { data: corsi } = useCorsi()
  return (
    <div className="space-y-3">
      <p className="text-xs text-text3">
        Codice dell’indirizzo di ogni corso nel SIDI (colonna IND_MINISTERIALE, es. A199): si salva uscendo dal campo.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {corsi?.map((c) => <CodiceCorso key={c.id} corso={c} />)}
      </div>
    </div>
  )
}

function ImportLog() {
  const { data: log, isLoading, error } = useImportLog()
  return (
    <Card>
      <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-text2">Import Google Moduli</h2>
      <p className="mb-3 text-xs text-text3">
        Ultime 50 risposte ricevute dal modulo. “Open Day non trovato” = l’opzione scelta nel menu non corrisponde
        all’etichetta di nessun Open Day: correggi l’etichetta e rilancia <code>reinviaTutte</code> dall’Apps Script.
      </p>
      {isLoading && <Spinner />}
      {error && <ErrorBanner message="Errore nel caricamento del registro." />}
      {log?.length === 0 && <p className="text-sm text-text3">Nessuna risposta ricevuta finora.</p>}
      <div className="divide-y divide-border">
        {log?.map((r) => {
          const p = r.payload as { cognome?: string; nome?: string; openDay?: string }
          return (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <div className="min-w-0">
                <p className="font-bold text-text">
                  {p.cognome ?? '—'} {p.nome ?? ''}
                </p>
                <p className="text-xs text-text3">
                  {new Date(r.ricevuto_at).toLocaleString('it-IT')} · {p.openDay ?? 'Open Day non indicato'}
                  {r.messaggio ? ` · ${r.messaggio}` : ''}
                </p>
              </div>
              <Badge color={ESITO_BADGE[r.esito].color}>{ESITO_BADGE[r.esito].label}</Badge>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export function ImpostazioniPage() {
  const { data: imp, isLoading, error } = useImpostazioni()
  const update = useUpdateImpostazioni()
  const [salvato, setSalvato] = useState(false)
  const { register, handleSubmit, reset, control, formState } = useForm<FormValues>()

  useEffect(() => {
    if (imp) reset(imp)
  }, [imp, reset])

  const valori = useWatch({ control })
  const esempio = esempioOpenDay()

  async function salva(v: FormValues) {
    setSalvato(false)
    await update.mutateAsync(v)
    setSalvato(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-text">Impostazioni</h1>
        <p className="text-sm text-text3">Luogo, canale e testi dei messaggi inviati alle famiglie.</p>
      </div>

      {isLoading && <Spinner />}
      {error && <ErrorBanner message="Errore nel caricamento delle impostazioni." />}

      {imp && (
        <form onSubmit={handleSubmit(salva)} className="space-y-6">
          <Card className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-text2">Dove presentarsi (predefinito)</h2>
            <InputField label="Luogo" required {...register('luogo_predefinito', { required: true })} />
            <TextareaField label="Indicazioni" rows={2} {...register('indicazioni_predefinite')} />
            <InputField label="Contatti per informazioni" {...register('contatti')} />
            <p className="text-xs text-text3">
              Un singolo Open Day può avere luogo e indicazioni diversi: si impostano da Open Day → Modifica.
            </p>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-text2">Dati per INNOVAPLAN</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField
                label="Codice meccanografico sede"
                required
                className="uppercase"
                {...register('codice_meccanografico_sede', { required: true })}
              />
              <InputField
                label="Classificazione ministeriale"
                required
                className="uppercase"
                {...register('classificazione_ministeriale', { required: true })}
              />
            </div>
            <CodiciCorsi />
          </Card>

          <Card className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-text2">Canale di invio</h2>
            {(Object.keys(CANALE_NOTIFICA_LABEL) as CanaleNotifica[]).map((c) => (
              <label key={c} className="flex cursor-pointer items-start gap-2 text-sm">
                <input type="radio" value={c} className="mt-0.5 accent-orange" {...register('canale_predefinito')} />
                <span>{CANALE_NOTIFICA_LABEL[c]}</span>
              </label>
            ))}
            <p className="text-xs text-text3">
              Se il canale è Email e la famiglia non ha lasciato l’email, il messaggio passa automaticamente a WhatsApp
              manuale. SMS e WhatsApp automatico partono solo dopo aver configurato il servizio a pagamento (vedi
              README); finché non è attivo, le notifiche vanno in errore e si possono inviare con “Invia su WhatsApp”.
            </p>
          </Card>

          <Card className="space-y-5">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-text2">Testi dei messaggi</h2>
              <p className="text-xs text-text3">Segnaposto disponibili: {SEGNAPOSTO.join(' ')}</p>
            </div>
            {TESTI.map(({ campo, label }) => (
              <div key={campo} className="space-y-2">
                <TextareaField label={label} rows={4} required {...register(campo, { required: true })} />
                <div className="rounded-il border border-dashed border-border bg-gray-xlight p-3 text-xs text-text2">
                  <span className="font-bold text-text3">Anteprima: </span>
                  {componiMessaggio(
                    valori[campo] ?? '',
                    ESEMPIO_BOOKING,
                    esempio,
                    {
                      luogo_predefinito: valori.luogo_predefinito ?? '',
                      indicazioni_predefinite: valori.indicazioni_predefinite ?? '',
                      contatti: valori.contatti ?? '',
                    },
                    campo === 'testo_rifiuto' ? 'I posti per questa data sono esauriti.' : null,
                  )}
                </div>
              </div>
            ))}
          </Card>

          {update.error && <ErrorBanner message="Salvataggio non riuscito, riprova." />}
          <div className="flex items-center justify-end gap-3">
            {salvato && !formState.isDirty && <span className="text-sm font-bold text-green">✓ Salvato</span>}
            <Button type="submit" disabled={update.isPending || !formState.isDirty}>
              {update.isPending ? 'Salvataggio…' : 'Salva impostazioni'}
            </Button>
          </div>
        </form>
      )}

      <ImportLog />
    </div>
  )
}
