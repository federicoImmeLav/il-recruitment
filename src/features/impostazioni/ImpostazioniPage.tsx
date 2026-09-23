import { useEffect, useState } from 'react'
import { useSnackbar } from '../../components/ui/Snackbar'
import { Icon } from '../../components/ui/Icon'
import { List } from '../../components/ui/List'
import { EmptyState, PageHeader, SectionHeader } from '../../components/ui/PageHeader'
import { useForm, useWatch } from 'react-hook-form'
import { Badge, type BadgeColor } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { InputField, RadioField, TextareaField } from '../../components/ui/Field'
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

const ESITO_BADGE: Record<EsitoImport, { color: BadgeColor; label: string }> = {
  importata: { color: 'success', label: 'Importata' },
  duplicata: { color: 'neutral', label: 'Già importata' },
  open_day_non_trovato: { color: 'warning', label: 'Open Day non trovato' },
  errore: { color: 'error', label: 'Errore' },
}

function CodiceCorso({ corso }: { corso: Corso }) {
  const update = useUpdateCodiceCorso()
  const [valore, setValore] = useState(corso.codice_ministeriale ?? '')
  const salvato = (corso.codice_ministeriale ?? '') === valore.trim().toUpperCase()

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <InputField
          label={corso.nome}
          placeholder="es. A199"
          maxLength={10}
          className="[&_input]:uppercase"
          value={valore}
          onChange={(e) => setValore(e.target.value)}
          onBlur={() => {
            if (!salvato) void update.mutateAsync({ id: corso.id, codice_ministeriale: valore.trim().toUpperCase() || null })
          }}
        />
      </div>
      <span className="w-6 text-body-s">
        {update.isPending ? (
          '…'
        ) : update.error ? (
          <Icon name="error" size={20} label="Errore nel salvataggio" className="text-error" />
        ) : salvato && valore ? (
          <Icon name="check_circle" size={20} label="Salvato" className="text-success" />
        ) : null}
      </span>
    </div>
  )
}

function CodiciCorsi() {
  const { data: corsi } = useCorsi()
  return (
    <div className="space-y-4">
      <p className="text-body-s text-on-surface-variant">
        Codice dell’indirizzo di ogni corso nel SIDI (colonna IND_MINISTERIALE, es. A199): si salva uscendo dal campo.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {corsi?.map((c) => <CodiceCorso key={c.id} corso={c} />)}
      </div>
    </div>
  )
}

function ImportLog() {
  const { data: log, isLoading, error } = useImportLog()
  return (
    <Card>
      <SectionHeader title="Import Google Moduli" className="!mb-1" />
      <p className="mb-3 text-body-s text-on-surface-variant">
        Ultime 50 risposte ricevute dal modulo. “Open Day non trovato” = l’opzione scelta nel menu non corrisponde
        all’etichetta di nessun Open Day: correggi l’etichetta e rilancia <code>reinviaTutte</code> dall’Apps Script.
      </p>
      {isLoading && <Spinner />}
      {error && <ErrorBanner message="Errore nel caricamento del registro." />}
      {log?.length === 0 && <EmptyState icon="inbox">Nessuna risposta ricevuta finora.</EmptyState>}
      <List>
        {log?.map((r) => {
          const p = r.payload as { cognome?: string; nome?: string; openDay?: string }
          return (
            <li key={r.id} className="flex min-h-18 flex-wrap items-center justify-between gap-2 py-2">
              <div className="min-w-0">
                <p className="text-title-s text-on-surface">
                  {p.cognome ?? '—'} {p.nome ?? ''}
                </p>
                <p className="text-body-s text-on-surface-variant">
                  {new Date(r.ricevuto_at).toLocaleString('it-IT')} · {p.openDay ?? 'Open Day non indicato'}
                  {r.messaggio ? ` · ${r.messaggio}` : ''}
                </p>
              </div>
              <Badge color={ESITO_BADGE[r.esito].color}>{ESITO_BADGE[r.esito].label}</Badge>
            </li>
          )
        })}
      </List>
    </Card>
  )
}

export function ImpostazioniPage() {
  const { data: imp, isLoading, error } = useImpostazioni()
  const update = useUpdateImpostazioni()
  const snackbar = useSnackbar()
  const { register, handleSubmit, reset, control, formState } = useForm<FormValues>()

  useEffect(() => {
    if (imp) reset(imp)
  }, [imp, reset])

  const valori = useWatch({ control })
  const esempio = esempioOpenDay()

  async function salva(v: FormValues) {
    await update.mutateAsync(v)
    reset(v)
    snackbar('Impostazioni salvate')
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Impostazioni" subtitle="Luogo, canale e testi dei messaggi inviati alle famiglie." />

      {isLoading && <Spinner />}
      {error && <ErrorBanner message="Errore nel caricamento delle impostazioni." />}

      {imp && (
        <form onSubmit={handleSubmit(salva)} className="space-y-6">
          <Card className="space-y-4">
            <SectionHeader title="Dove presentarsi (predefinito)" />
            <InputField label="Luogo" required {...register('luogo_predefinito', { required: true })} />
            <TextareaField label="Indicazioni" rows={2} {...register('indicazioni_predefinite')} />
            <InputField
              label="Contatti per informazioni"
              supporting="Un singolo Open Day può avere luogo e indicazioni diversi: si impostano da Open Day → Modifica."
              {...register('contatti')}
            />
          </Card>

          <Card className="space-y-4">
            <SectionHeader title="Dati per INNOVAPLAN" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField
                label="Codice meccanografico sede"
                required
                className="[&_input]:uppercase"
                {...register('codice_meccanografico_sede', { required: true })}
              />
              <InputField
                label="Classificazione ministeriale"
                required
                className="[&_input]:uppercase"
                {...register('classificazione_ministeriale', { required: true })}
              />
            </div>
            <CodiciCorsi />
          </Card>

          <Card className="space-y-2">
            <SectionHeader title="Canale di invio" />
            <div role="radiogroup" aria-label="Canale di invio">
              {(Object.keys(CANALE_NOTIFICA_LABEL) as CanaleNotifica[]).map((c) => (
                <RadioField key={c} value={c} label={CANALE_NOTIFICA_LABEL[c]} {...register('canale_predefinito')} />
              ))}
            </div>
            <p className="text-body-s text-on-surface-variant">
              Se il canale è Email e la famiglia non ha lasciato l’email, il messaggio passa automaticamente a WhatsApp
              manuale. SMS e WhatsApp automatico partono solo dopo aver configurato il servizio a pagamento (vedi
              README); finché non è attivo, le notifiche vanno in errore e si possono inviare con “Invia su WhatsApp”.
            </p>
          </Card>

          <Card className="space-y-5">
            <div>
              <SectionHeader title="Testi dei messaggi" className="!mb-1" />
              <p className="text-body-s text-on-surface-variant">Segnaposto disponibili: {SEGNAPOSTO.join(' ')}</p>
            </div>
            {TESTI.map(({ campo, label }) => (
              <div key={campo} className="space-y-2">
                <TextareaField label={label} rows={4} required {...register(campo, { required: true })} />
                <div className="rounded-md bg-surface-container p-4 text-body-m text-on-surface-variant">
                  <span className="mb-1 flex items-center gap-1 text-label-m text-on-surface">
                    <Icon name="visibility" size={16} />
                    Anteprima
                  </span>
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
            <Button type="submit" icon="save" disabled={update.isPending || !formState.isDirty}>

              {update.isPending ? 'Salvataggio…' : 'Salva impostazioni'}
            </Button>
          </div>
        </form>
      )}

      <ImportLog />
    </div>
  )
}
