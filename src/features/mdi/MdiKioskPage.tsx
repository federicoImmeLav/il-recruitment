import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { FormProvider, useForm } from 'react-hook-form'
import { Button } from '../../components/ui/Button'
import { ErrorBanner, InfoBanner } from '../../components/ui/Spinner'
import { SelectField } from '../../components/ui/Field'
import { Icon } from '../../components/ui/Icon'
import { useCorsi } from '../../hooks/useCorsi'
import { useCreateMdi } from '../../hooks/useMdi'
import { useOpenDaysPublic } from '../../hooks/useOpenDays'
import type { KioskDatiIscritto } from '../../types/database.types'
import { MdiPrintDocument } from './MdiPrintDocument'
import { MDI_DEFAULT_VALUES, STEP_FIELDS, STEP_TITLES, type MdiFormValues } from './mdiFormTypes'
import { StepIdentificazione } from './steps/StepIdentificazione'
import { StepDatiAllievo } from './steps/StepDatiAllievo'
import { StepGenitore } from './steps/StepGenitore'
import { mdiDaForm } from './mdiDaForm'
import { StepCorsiCertificazioni } from './steps/StepCorsiCertificazioni'
import { StepPrivacy } from './steps/StepPrivacy'

const STEP_SUB = [
  "Digita il cognome o il nome dell'allievo per trovare l'iscrizione all'Open Day, oppure compila i dati se non sei ancora iscritto.",
  'Inizia dal codice fiscale: sesso, data e luogo di nascita si compilano da soli. I campi con il badge blu vengono dalla registrazione.',
  'Dati del genitore o tutore che firma il modulo.',
  'Indica fino a 3 corsi in ordine di preferenza. Se hai cambiato idea rispetto alla registrazione, modifica liberamente.',
  'Leggi le informative ed esprimi il consenso per ciascun punto. La firma olografa verrà raccolta sulla stampa.',
  '',
]

function oggiIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function annoScolasticoInCorso(d = new Date()) {
  const inizio = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1
  return `${inizio}/${String((inizio + 1) % 100).padStart(2, '0')}`
}

function KioskHeader() {
  return (
    <header className="no-print sticky top-0 z-10 flex items-center justify-between gap-4 bg-surface-container-lowest px-4 py-2 shadow-elev-1 sm:px-8">
      <img src="/logo-il.jpg" alt="Immaginazione e Lavoro" className="h-12 sm:h-14" />
      <div className="text-right">
        <p className="text-label-m text-on-surface-variant">Open Day {annoScolasticoInCorso()}</p>
        <p className="text-title-m text-on-surface sm:text-title-l">Manifestazione d'Interesse</p>
      </div>
    </header>
  )
}

function Progress({ step }: { step: number }) {
  return (
    <div className="no-print bg-surface-container-lowest px-4 py-3 sm:px-8">
      <ol aria-label="Passaggi" className="mx-auto flex max-w-3xl items-center">
        {STEP_TITLES.map((title, i) => {
          const stato = i < step ? 'done' : i === step ? 'active' : 'todo'
          return (
            <li
              key={title}
              aria-current={stato === 'active' ? 'step' : undefined}
              className={`flex items-center ${i < STEP_TITLES.length - 1 ? 'flex-1' : ''}`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-label-l ${
                  stato === 'done'
                    ? 'bg-primary-container text-on-primary-container'
                    : stato === 'active'
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-highest text-on-surface-variant'
                }`}
              >
                {stato === 'done' ? <Icon name="check" size={18} label="completato" /> : i + 1}
              </span>
              <span
                className={`ml-2 whitespace-nowrap text-label-l ${
                  stato === 'active' ? 'text-on-surface' : 'hidden text-on-surface-variant md:inline'
                }`}
              >
                {title}
              </span>
              {i < STEP_TITLES.length - 1 && (
                <span className={`mx-2 h-0.5 flex-1 rounded-full ${i < step ? 'bg-primary' : 'bg-outline-variant'}`} />
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/** Mappa i dati della registrazione Open Day sui campi MDI da precompilare. */
function campiDaIscritto(d: KioskDatiIscritto): Partial<MdiFormValues> {
  const campi: Partial<MdiFormValues> = {
    all_cognome: d.cognome,
    all_nome: d.nome,
    all_data_nascita: d.data_nascita ?? '',
    all_scuola_provenienza: d.scuola ?? '',
    acc_cognome: d.acc_cognome ?? '',
    acc_nome: d.acc_nome ?? '',
    acc_cellulare: d.telefono,
    acc_email: d.email ?? '',
    corso_pref1_id: d.corso_id ?? '',
    corso_pref2_id: d.corso2_id && d.corso2_id !== d.corso_id ? d.corso2_id : '',
  }
  return Object.fromEntries(Object.entries(campi).filter(([, v]) => v)) as Partial<MdiFormValues>
}

export function MdiKioskPage() {
  const { openDayId: openDayIdParam } = useParams<{ openDayId?: string }>()
  const { data: openDays } = useOpenDaysPublic()
  const { data: corsi } = useCorsi()
  const createMdi = useCreateMdi()

  // Senza id nel link, usa l'Open Day di oggi (se ce n'e' uno solo).
  const openDaysOggi = useMemo(() => openDays?.filter((o) => o.data === oggiIso()) ?? [], [openDays])
  const [openDayScelto, setOpenDayScelto] = useState<string>()
  const openDayId = openDayIdParam ?? openDayScelto ?? (openDaysOggi.length === 1 ? openDaysOggi[0].id : undefined)

  const [step, setStep] = useState(0)
  const [iscritto, setIscritto] = useState<KioskDatiIscritto | null>(null)
  const [precompilati, setPrecompilati] = useState<ReadonlySet<keyof MdiFormValues>>(new Set())
  const [inviata, setInviata] = useState<MdiFormValues | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const methods = useForm<MdiFormValues>({ defaultValues: MDI_DEFAULT_VALUES, mode: 'onTouched' })
  const { handleSubmit, trigger, reset, getValues } = methods

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  function selezionaIscritto(dati: KioskDatiIscritto | null) {
    setIscritto(dati)
    if (!dati) {
      reset(MDI_DEFAULT_VALUES)
      setPrecompilati(new Set())
      return
    }
    const campi = campiDaIscritto(dati)
    reset({ ...MDI_DEFAULT_VALUES, ...campi })
    setPrecompilati(new Set(Object.keys(campi) as (keyof MdiFormValues)[]))
  }

  async function avanti() {
    const valido = await trigger(STEP_FIELDS[step], { shouldFocus: true })
    if (valido) setStep((s) => Math.min(s + 1, STEP_TITLES.length - 1))
  }

  function indietro() {
    setStep((s) => Math.max(s - 1, 0))
  }

  function stampa() {
    setTimeout(() => window.print(), 300)
  }

  function nuovaMdi() {
    selezionaIscritto(null)
    setInviata(null)
    setSubmitError(null)
    setStep(0)
  }

  async function invia(v: MdiFormValues) {
    setSubmitError(null)
    // Preferenze senza duplicati, compattate in ordine.
    const prefs = [...new Set([v.corso_pref1_id, v.corso_pref2_id, v.corso_pref3_id].filter(Boolean))]
    const valori: MdiFormValues = {
      ...v,
      corso_pref1_id: prefs[0] ?? '',
      corso_pref2_id: prefs[1] ?? '',
      corso_pref3_id: prefs[2] ?? '',
    }
    try {
      await createMdi.mutateAsync(
        mdiDaForm(v, { openDayId: iscritto?.open_day_id ?? openDayId ?? null, bookingId: iscritto?.id ?? null }),
      )
      setInviata(valori)
      stampa()
    } catch {
      setSubmitError('Invio non riuscito. Verifica la connessione e riprova, oppure chiedi a un operatore.')
    }
  }

  const titoli = [
    'Benvenuto!',
    "Dati dell'allievo",
    'Genitore / tutore',
    'Corsi di interesse e certificazioni',
    'Informativa privacy e consensi',
    inviata ? 'Grazie!' : `Grazie, ${getValues('all_nome')} ${getValues('all_cognome')}!`,
  ]

  return (
    <div className="min-h-dvh bg-surface-container-low">
      <KioskHeader />
      <Progress step={step} />

      <main className="no-print mx-auto max-w-3xl px-4 pb-20 pt-8 sm:px-6">
        <h1 className="text-headline-m text-on-surface">{titoli[step]}</h1>
        {STEP_SUB[step] && <p className="mb-6 mt-2 text-body-l text-on-surface-variant">{STEP_SUB[step]}</p>}

        {step === 0 && !openDayIdParam && openDaysOggi.length > 1 && (
          <SelectField
            label="Open Day in corso"
            className="mb-6"
            value={openDayId ?? ''}
            onChange={(e) => {
              setOpenDayScelto(e.target.value || undefined)
              selezionaIscritto(null)
            }}
          >
            <option value="">Seleziona…</option>
            {openDaysOggi.map((o) => (
              <option key={o.id} value={o.id}>
                {o.ora.slice(0, 5)} — {o.tipo === 'OpenDay2e' ? 'Open Day 2ª edizione' : 'Open Day'}
              </option>
            ))}
          </SelectField>
        )}

        <FormProvider {...methods}>
          <form onSubmit={(e) => e.preventDefault()} noValidate className="space-y-5">
            {step === 0 && (
              <StepIdentificazione
                selezionato={iscritto}
                onSeleziona={selezionaIscritto}
                onAvanti={() => setStep(1)}
              />
            )}
            {step === 1 && <StepDatiAllievo precompilati={precompilati} />}
            {step === 2 && <StepGenitore precompilati={precompilati} />}
            {step === 3 && <StepCorsiCertificazioni precompilati={precompilati} />}
            {step === 4 && <StepPrivacy />}

            {step === 5 && (
              <div className="flex flex-col items-center rounded-lg border border-outline-variant bg-surface-container-lowest px-6 py-12 text-center">
                <span
                  className={`mb-6 flex h-20 w-20 items-center justify-center rounded-full ${
                    inviata ? 'bg-success-container text-on-success-container' : 'bg-primary-container text-on-primary-container'
                  }`}
                >
                  <Icon name={inviata ? 'task_alt' : 'assignment'} size={44} />
                </span>
                {!inviata ? (
                  <>
                    <p className="mb-8 max-w-lg text-body-l text-on-surface-variant">
                      La manifestazione d'interesse è stata compilata.
                      <br />
                      Premi il pulsante per inviarla e stamparla: l'operatore recupererà il modulo e farà apporre la
                      firma olografa.
                    </p>
                    {submitError && (
                      <div className="mb-4 w-full text-left">
                        <ErrorBanner message={submitError} />
                      </div>
                    )}
                    <Button
                      size="lg"
                      icon="print"
                      disabled={createMdi.isPending}
                      onClick={() => void handleSubmit(invia)()}
                    >
                      {createMdi.isPending ? 'Invio in corso…' : 'Invia e stampa'}
                    </Button>
                  </>
                ) : (
                  <>
                    <InfoBanner tone="success" icon="check_circle" className="max-w-md text-left !text-body-l">
                      <strong>Modulo inviato.</strong> Recupera il documento stampato, fai apporre la firma e archivia la copia.
                    </InfoBanner>
                    <div className="mt-8 flex flex-col items-center gap-3">
                      <Button size="lg" icon="add" onClick={nuovaMdi}>
                        Nuova Manifestazione di Interesse
                      </Button>
                      <Button variant="text" icon="print" onClick={stampa}>
                        Stampa di nuovo
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {step > 0 && !inviata && (
              <div className="flex justify-between gap-3 pt-2 sm:justify-end">
                <Button size="lg" variant="outlined" icon="arrow_back" onClick={indietro}>
                  Indietro
                </Button>
                {step < 5 && (
                  <Button size="lg" trailingIcon="arrow_forward" onClick={() => void avanti()}>
                    Avanti
                  </Button>
                )}
              </div>

            )}
          </form>
        </FormProvider>
      </main>

      {inviata && corsi && <MdiPrintDocument v={inviata} corsi={corsi} />}
    </div>
  )
}
