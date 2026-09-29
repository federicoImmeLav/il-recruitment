import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useSnackbar } from '../../components/ui/Snackbar'
import { Icon } from '../../components/ui/Icon'
import { List } from '../../components/ui/List'
import { EmptyState, PageHeader, SectionHeader } from '../../components/ui/PageHeader'
import { Badge, type BadgeColor } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Checkbox, InputField, RadioField, TextareaField } from '../../components/ui/Field'
import { ErrorBanner, InfoBanner, Spinner } from '../../components/ui/Spinner'
import { useImpostazioni, useImportLog, useUpdateImpostazioni } from '../../hooks/useNotifiche'
import { useCorsiGestione, useSalvaCorso, type CorsoModificabile } from '../../hooks/useCorsi'
import { useSalvaSede } from '../../hooks/useSedi'
import { CANALE_NOTIFICA_LABEL } from '../../lib/constants'
import { SEGNAPOSTO, componiMessaggio } from '../../lib/messaggi'
import type { CanaleNotifica, Corso, EsitoImport, Impostazioni, Sede } from '../../types/database.types'
import { useSede } from '../sedi/SedeProvider'
import { ScegliSedePrima } from '../sedi/SedeSelector'

const ESEMPIO_BOOKING = { nome: 'Mario', cognome: 'Rossi' }
function esempioOpenDay() {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  return { data: d.toISOString().slice(0, 10), ora: '10:00', luogo_override: null }
}
const ESEMPIO_MOTIVO = 'I posti per questa data sono esauriti.'

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

function Anteprima({ testo, sede, rifiuto }: { testo: string; sede: Pick<Sede, 'luogo' | 'indicazioni' | 'contatti'>; rifiuto: boolean }) {
  return (
    <div className="rounded-md bg-surface-container p-4 text-body-m text-on-surface-variant">
      <span className="mb-1 flex items-center gap-1 text-label-m text-on-surface">
        <Icon name="visibility" size={16} />
        Anteprima
      </span>
      {componiMessaggio(testo, ESEMPIO_BOOKING, esempioOpenDay(), sede, rifiuto ? ESEMPIO_MOTIVO : null)}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Configurazione della sede
// ---------------------------------------------------------------------------

type SedeForm = Pick<
  Sede,
  | 'luogo'
  | 'indicazioni'
  | 'contatti'
  | 'luogo_firma'
  | 'mittente_nome'
  | 'mittente_email'
  | 'codice_meccanografico'
  | 'classificazione_ministeriale'
  | 'testo_approvazione'
  | 'testo_rifiuto'
  | 'testo_reminder'
>

function valoriSede(s: Sede): SedeForm {
  return {
    luogo: s.luogo,
    indicazioni: s.indicazioni,
    contatti: s.contatti,
    luogo_firma: s.luogo_firma ?? '',
    mittente_nome: s.mittente_nome ?? '',
    mittente_email: s.mittente_email ?? '',
    codice_meccanografico: s.codice_meccanografico,
    classificazione_ministeriale: s.classificazione_ministeriale,
    testo_approvazione: s.testo_approvazione ?? '',
    testo_rifiuto: s.testo_rifiuto ?? '',
    testo_reminder: s.testo_reminder ?? '',
  }
}

const vuotoANull = (v: string | null) => (v?.trim() ? v.trim() : null)

function ImpostazioniSede({ sede, template }: { sede: Sede; template: Impostazioni | undefined }) {
  const salva = useSalvaSede()
  const snackbar = useSnackbar()
  const { citta } = useSede()
  const { register, handleSubmit, reset, control, formState } = useForm<SedeForm>({ defaultValues: valoriSede(sede) })
  const valori = useWatch({ control })
  const nomeCitta = citta.find((c) => c.id === sede.citta_id)?.nome ?? ''

  async function invia(v: SedeForm) {
    await salva.mutateAsync({
      id: sede.id,
      patch: {
        luogo: v.luogo.trim(),
        indicazioni: v.indicazioni.trim(),
        contatti: v.contatti.trim(),
        luogo_firma: vuotoANull(v.luogo_firma),
        mittente_nome: vuotoANull(v.mittente_nome),
        mittente_email: vuotoANull(v.mittente_email),
        codice_meccanografico: v.codice_meccanografico.trim().toUpperCase(),
        classificazione_ministeriale: v.classificazione_ministeriale.trim().toUpperCase(),
        testo_approvazione: vuotoANull(v.testo_approvazione),
        testo_rifiuto: vuotoANull(v.testo_rifiuto),
        testo_reminder: vuotoANull(v.testo_reminder),
      },
    })
    reset(v)
    snackbar(`Impostazioni della sede ${sede.nome} salvate`)
  }

  const perAnteprima = { luogo: valori.luogo ?? '', indicazioni: valori.indicazioni ?? '', contatti: valori.contatti ?? '' }

  return (
    <form onSubmit={handleSubmit(invia)} className="space-y-6">
      <Card className="space-y-4">
        <SectionHeader title={`Dove presentarsi — ${sede.nome}`} />
        <InputField label="Luogo" required {...register('luogo', { required: true })} />
        <TextareaField label="Indicazioni" rows={2} {...register('indicazioni')} />
        <InputField
          label="Contatti per informazioni"
          supporting="Un singolo Open Day può avere luogo e indicazioni diversi: si impostano da Open Day → Modifica."
          {...register('contatti')}
        />
        <InputField
          label="Luogo accanto alle firme della MDI"
          placeholder={nomeCitta}
          supporting={`Vuoto = “${nomeCitta}, il …”`}
          {...register('luogo_firma')}
        />
      </Card>

      <Card className="space-y-4">
        <SectionHeader title="Mittente delle email" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField label="Nome mittente" placeholder="Immaginazione e Lavoro" {...register('mittente_nome')} />
          <InputField
            label="Email mittente"
            type="email"
            placeholder="Quella predefinita"
            {...register('mittente_email')}
          />
        </div>
        <p className="text-body-s text-on-surface-variant">
          Vuoti = mittente predefinito. Un indirizzo nuovo va prima verificato su Brevo, altrimenti le email vanno in
          errore.
        </p>
      </Card>

      <Card className="space-y-4">
        <SectionHeader title="Dati per INNOVAPLAN" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField
            label="Codice meccanografico sede"
            required
            className="[&_input]:uppercase"
            error={formState.errors.codice_meccanografico ? 'Obbligatorio per l’export' : undefined}
            {...register('codice_meccanografico', { required: true })}
          />
          <InputField
            label="Classificazione ministeriale"
            required
            className="[&_input]:uppercase"
            {...register('classificazione_ministeriale', { required: true })}
          />
        </div>
      </Card>

      <Card className="space-y-5">
        <div>
          <SectionHeader title="Testi dei messaggi della sede" className="!mb-1" />
          <p className="text-body-s text-on-surface-variant">
            Lascia vuoto per usare il testo comune a tutte le sedi. Segnaposto: {SEGNAPOSTO.join(' ')}
          </p>
        </div>
        {TESTI.map(({ campo, label }) => {
          const proprio = valori[campo]?.trim()
          return (
            <div key={campo} className="space-y-2">
              <TextareaField label={label} rows={4} placeholder="Testo comune a tutte le sedi" {...register(campo)} />
              <Anteprima
                testo={proprio || template?.[campo] || ''}
                sede={perAnteprima}
                rifiuto={campo === 'testo_rifiuto'}
              />
            </div>
          )
        })}
      </Card>

      {salva.error && <ErrorBanner message="Salvataggio non riuscito, riprova." />}
      <div className="flex items-center justify-end gap-3">
        <Button type="submit" icon="save" disabled={salva.isPending || !formState.isDirty}>
          {salva.isPending ? 'Salvataggio…' : 'Salva impostazioni della sede'}
        </Button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Corsi (indirizzi) della sede
// ---------------------------------------------------------------------------

function RigaCorso({ corso, sedeId }: { corso: Corso; sedeId: string }) {
  const salva = useSalvaCorso()
  const [valori, setValori] = useState({
    nome: corso.nome,
    qualifica: corso.qualifica,
    codice_ministeriale: corso.codice_ministeriale ?? '',
    ordine: String(corso.ordine),
  })

  // Salvataggio all'uscita dal campo, solo se il valore e' cambiato.
  function salvaCampo(patch: Partial<CorsoModificabile>) {
    void salva.mutateAsync({ id: corso.id, sedeId, patch })
  }

  return (
    <li className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-[1fr_1fr_8rem_5rem_auto] sm:items-center">
      <InputField
        dense
        label="Nome"
        value={valori.nome}
        onChange={(e) => setValori({ ...valori, nome: e.target.value })}
        onBlur={() => valori.nome.trim() && valori.nome.trim() !== corso.nome && salvaCampo({ nome: valori.nome.trim() })}
      />
      <InputField
        dense
        label="Qualifica"
        value={valori.qualifica}
        onChange={(e) => setValori({ ...valori, qualifica: e.target.value })}
        onBlur={() => valori.qualifica.trim() !== corso.qualifica && salvaCampo({ qualifica: valori.qualifica.trim() })}
      />
      <InputField
        dense
        label="Codice"
        placeholder="es. A199"
        maxLength={10}
        className="[&_input]:uppercase"
        value={valori.codice_ministeriale}
        onChange={(e) => setValori({ ...valori, codice_ministeriale: e.target.value })}
        onBlur={() => {
          const c = valori.codice_ministeriale.trim().toUpperCase() || null
          if (c !== corso.codice_ministeriale) salvaCampo({ codice_ministeriale: c })
        }}
      />
      <InputField
        dense
        label="Ordine"
        type="number"
        inputMode="numeric"
        value={valori.ordine}
        onChange={(e) => setValori({ ...valori, ordine: e.target.value })}
        onBlur={() => Number(valori.ordine) !== corso.ordine && salvaCampo({ ordine: Number(valori.ordine) || 0 })}
      />
      <label className="-ml-2.5 flex cursor-pointer items-center gap-1 text-body-m text-on-surface">
        <Checkbox checked={corso.attivo} onChange={(e) => salvaCampo({ attivo: e.target.checked })} />
        Attivo
        <span className="ml-2 w-6">
          {salva.isPending ? (
            '…'
          ) : salva.error ? (
            <Icon name="error" size={20} label="Errore nel salvataggio" className="text-error" />
          ) : null}
        </span>
      </label>
    </li>
  )
}

function CorsiSede({ sede }: { sede: Sede }) {
  const { data: corsi, isLoading, error } = useCorsiGestione(sede.id)
  const salva = useSalvaCorso()
  const [nuovo, setNuovo] = useState({ nome: '', qualifica: '' })

  async function aggiungi() {
    await salva.mutateAsync({
      sedeId: sede.id,
      patch: { nome: nuovo.nome.trim(), qualifica: nuovo.qualifica.trim(), ordine: (corsi?.length ?? 0) + 1 },
    })
    setNuovo({ nome: '', qualifica: '' })
  }

  return (
    <Card className="space-y-2">
      <SectionHeader title={`Corsi (indirizzi) — ${sede.nome}`} className="!mb-1" />
      <p className="text-body-s text-on-surface-variant">
        Proposti nei form di iscrizione e nella MDI di questa sede. Il codice è quello dell’indirizzo nel SIDI
        (IND_MINISTERIALE, es. A199), usato dall’export INNOVAPLAN. I campi si salvano uscendo dal campo; un corso non
        più offerto va disattivato (le iscrizioni e MDI già raccolte lo conservano).
      </p>
      {isLoading && <Spinner />}
      {error && <ErrorBanner message="Errore nel caricamento dei corsi." />}
      {corsi?.length === 0 && <EmptyState icon="school">Nessun corso: aggiungi il primo qui sotto.</EmptyState>}
      <List>
        {corsi?.map((c) => <RigaCorso key={c.id} corso={c} sedeId={sede.id} />)}
      </List>
      <div className="grid grid-cols-1 gap-3 border-t border-outline-variant pt-4 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
        <InputField dense label="Nuovo corso" value={nuovo.nome} onChange={(e) => setNuovo({ ...nuovo, nome: e.target.value })} />
        <InputField
          dense
          label="Qualifica"
          value={nuovo.qualifica}
          onChange={(e) => setNuovo({ ...nuovo, qualifica: e.target.value })}
        />
        <Button
          variant="tonal"
          icon="add"
          disabled={!nuovo.nome.trim() || !nuovo.qualifica.trim() || salva.isPending}
          onClick={() => void aggiungi()}
        >
          Aggiungi
        </Button>
      </div>
      {salva.error && (
        <ErrorBanner
          message={
            (salva.error as { code?: string }).code === '23505'
              ? 'Esiste già un corso con questo nome nella sede.'
              : 'Salvataggio non riuscito, riprova.'
          }
        />
      )}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Template comuni a tutte le sedi (modificabili solo dall'admin)
// ---------------------------------------------------------------------------

type TemplateForm = Omit<Impostazioni, 'id' | 'updated_at'>

function TemplateComuni({ imp }: { imp: Impostazioni }) {
  const { isAdmin, sede, sedi } = useSede()
  const update = useUpdateImpostazioni()
  const snackbar = useSnackbar()
  const { register, handleSubmit, reset, control, formState } = useForm<TemplateForm>({ defaultValues: imp })
  const valori = useWatch({ control })
  const esempioSede = sede ?? sedi[0] ?? { luogo: 'Sede di esempio', indicazioni: '', contatti: '' }

  useEffect(() => {
    reset(imp)
  }, [imp, reset])

  async function salva(v: TemplateForm) {
    await update.mutateAsync(v)
    reset(v)
    snackbar('Testi comuni salvati')
  }

  return (
    <form onSubmit={handleSubmit(salva)} className="space-y-6">
      <fieldset disabled={!isAdmin} className="space-y-6">
        <Card className="space-y-2">
          <SectionHeader title="Canale di invio (tutte le sedi)" />
          <div role="radiogroup" aria-label="Canale di invio">
            {(Object.keys(CANALE_NOTIFICA_LABEL) as CanaleNotifica[]).map((c) => (
              <RadioField key={c} value={c} label={CANALE_NOTIFICA_LABEL[c]} {...register('canale_predefinito')} />
            ))}
          </div>
          <p className="text-body-s text-on-surface-variant">
            Se il canale è Email e la famiglia non ha lasciato l’email, il messaggio passa automaticamente a WhatsApp
            manuale. SMS e WhatsApp automatico partono solo dopo aver configurato il servizio a pagamento (vedi README);
            finché non è attivo, le notifiche vanno in errore e si possono inviare con “Invia su WhatsApp”.
          </p>
        </Card>

        <Card className="space-y-5">
          <div>
            <SectionHeader title="Testi comuni a tutte le sedi" className="!mb-1" />
            <p className="text-body-s text-on-surface-variant">
              Usati dalle sedi che non hanno un testo proprio. Segnaposto disponibili: {SEGNAPOSTO.join(' ')}
            </p>
          </div>
          {TESTI.map(({ campo, label }) => (
            <div key={campo} className="space-y-2">
              <TextareaField label={label} rows={4} required {...register(campo, { required: true })} />
              <Anteprima testo={valori[campo] ?? ''} sede={esempioSede} rifiuto={campo === 'testo_rifiuto'} />
            </div>
          ))}
        </Card>
      </fieldset>

      {!isAdmin ? (
        <InfoBanner>I testi comuni e il canale si modificano solo dagli amministratori.</InfoBanner>
      ) : (
        <>
          {update.error && <ErrorBanner message="Salvataggio non riuscito, riprova." />}
          <div className="flex items-center justify-end gap-3">
            <Button type="submit" icon="save" disabled={update.isPending || !formState.isDirty}>
              {update.isPending ? 'Salvataggio…' : 'Salva testi comuni'}
            </Button>
          </div>
        </>
      )}
    </form>
  )
}

function ImportLog() {
  const { data: log, isLoading, error } = useImportLog()
  return (
    <Card>
      <SectionHeader title="Import Google Moduli" className="!mb-1" />
      <p className="mb-3 text-body-s text-on-surface-variant">
        Ultime 50 risposte ricevute dai moduli delle tue città. “Open Day non trovato” = l’opzione scelta nel menu non
        corrisponde all’etichetta di nessun Open Day della città: correggi l’etichetta e rilancia{' '}
        <code>reinviaTutte</code> dall’Apps Script.
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
  const { sede, isAdmin } = useSede()
  const { data: imp, isLoading, error } = useImpostazioni()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Impostazioni"
        subtitle="Luogo, corsi, dati INNOVAPLAN e testi dei messaggi inviati alle famiglie."
        actions={
          // Su smartphone l'area admin non e' nella navigation bar: ci si arriva da qui.
          isAdmin && (
            <Button variant="outlined" icon="admin_panel_settings" to="/staff/admin" className="medium:hidden">
              Sedi e utenti
            </Button>
          )
        }
      />

      {isLoading && <Spinner />}
      {error && <ErrorBanner message="Errore nel caricamento delle impostazioni." />}

      {sede ? (
        <>
          {/* key: cambiando sede il form riparte dai valori della nuova sede. */}
          <ImpostazioniSede key={sede.id} sede={sede} template={imp} />
          <CorsiSede sede={sede} />
        </>
      ) : (
        <ScegliSedePrima azione="modificarne luogo, corsi, codici INNOVAPLAN e testi" />
      )}

      {imp && <TemplateComuni imp={imp} />}

      <ImportLog />
    </div>
  )
}
