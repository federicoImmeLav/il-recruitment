import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { FormProvider, useForm } from 'react-hook-form'
import { Button } from '../../components/ui/Button'
import { ErrorBanner } from '../../components/ui/Spinner'
import { useCorsi } from '../../hooks/useCorsi'
import { useCreateMdi } from '../../hooks/useMdi'
import { useOpenDaysPublic } from '../../hooks/useOpenDays'
import type { KioskDatiIscritto } from '../../types/database.types'
import { MdiPrintDocument } from './MdiPrintDocument'
import { MDI_DEFAULT_VALUES, STEP_FIELDS, STEP_TITLES, type MdiFormValues } from './mdiFormTypes'
import { StepIdentificazione } from './steps/StepIdentificazione'
import { StepDatiAllievo } from './steps/StepDatiAllievo'
import { StepCorsiCertificazioni } from './steps/StepCorsiCertificazioni'
import { StepPrivacy } from './steps/StepPrivacy'

const STEP_SUB = [
  "Digita il cognome dell'allievo per trovare la registrazione all'Open Day, oppure compila i dati se non sei ancora registrato.",
  'I campi con il badge blu sono precompilati dalla registrazione: puoi comunque modificarli.',
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
    <header className="no-print sticky top-0 z-10 flex items-center justify-between gap-4 border-b-[3px] border-border bg-white px-4 py-2 shadow-sm sm:px-8">
      <img src="/logo-il.jpg" alt="Immaginazione e Lavoro" className="h-12 sm:h-14" />
      <div className="text-right text-[11px] font-bold uppercase tracking-wider text-gray sm:text-xs">
        Open Day {annoScolasticoInCorso()}
        <span className="mt-0.5 block text-base normal-case tracking-normal text-text sm:text-xl">
          Manifestazione d'Interesse
        </span>
      </div>
    </header>
  )
}

function Progress({ step }: { step: number }) {
  return (
    <div className="no-print border-b border-border bg-white px-4 py-3 sm:px-8">
      <ol className="mx-auto flex max-w-3xl items-center">
        {STEP_TITLES.map((title, i) => {
          const stato = i < step ? 'done' : i === step ? 'active' : 'todo'
          return (
            <li key={title} className={`flex items-center ${i < STEP_TITLES.length - 1 ? 'flex-1' : ''}`}>
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                  stato === 'done' ? 'bg-green text-white' : stato === 'active' ? 'bg-blue text-white' : 'bg-border text-text3'
                }`}
              >
                {stato === 'done' ? '✓' : i + 1}
              </span>
              <span
                className={`ml-2 whitespace-nowrap text-xs font-bold ${
                  stato === 'done' ? 'text-green' : stato === 'active' ? 'text-blue' : 'text-text3'
                } ${stato === 'active' ? '' : 'hidden md:inline'}`}
              >
                {title}
              </span>
              {i < STEP_TITLES.length - 1 && (
                <span className={`mx-2 h-0.5 flex-1 ${i < step ? 'bg-green' : 'bg-border'}`} />
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
      await createMdi.mutateAsync({
        open_day_id: iscritto?.open_day_id ?? openDayId ?? null,
        booking_id: iscritto?.id ?? null,
        acc_cognome: v.acc_cognome.trim(),
        acc_nome: v.acc_nome.trim(),
        acc_qualita: v.acc_qualita as 'genitore' | 'tutore',
        acc_cellulare: v.acc_cellulare.trim(),
        acc_email: v.acc_email.trim(),
        all_cognome: v.all_cognome.trim(),
        all_nome: v.all_nome.trim(),
        all_data_nascita: v.all_data_nascita,
        all_annualita: Number(v.all_annualita),
        all_sezione: v.all_sezione || null,
        all_nato_a: v.all_nato_a.trim(),
        all_cittadinanza: v.all_cittadinanza.trim(),
        all_scuola_provenienza: v.all_scuola_provenienza.trim() || null,
        all_residenza_via: v.all_residenza_via.trim(),
        all_residenza_citta: v.all_residenza_citta.trim(),
        all_residenza_prov: v.all_residenza_prov.trim().toUpperCase() || null,
        all_residenza_cap: v.all_residenza_cap.trim() || null,
        all_domicilio_diverso: v.all_domicilio_diverso,
        all_domicilio_via: v.all_domicilio_diverso ? v.all_domicilio_via.trim() || null : null,
        all_domicilio_citta: v.all_domicilio_diverso ? v.all_domicilio_citta.trim() || null : null,
        all_domicilio_prov: v.all_domicilio_diverso ? v.all_domicilio_prov.trim().toUpperCase() || null : null,
        all_domicilio_cap: v.all_domicilio_diverso ? v.all_domicilio_cap.trim() || null : null,
        corso_pref1_id: prefs[0] ?? null,
        corso_pref2_id: prefs[1] ?? null,
        corso_pref3_id: prefs[2] ?? null,
        sostegno_stato: v.sostegno_stato || 'mai',
        sostegno_asl: v.sostegno_asl,
        sostegno_diagnosi_funzionale: v.sostegno_diagnosi_funzionale,
        sostegno_bes: v.sostegno_bes,
        sostegno_dsa: v.sostegno_dsa,
        canale_orientamento_scuola: v.canale_orientamento_scuola,
        canale_open_day: v.canale_open_day,
        canale_ricerca_online: v.canale_ricerca_online,
        canale_passaparola: v.canale_passaparola,
        canale_altro: v.canale_altro,
        canale_altro_testo: v.canale_altro ? v.canale_altro_testo.trim() || null : null,
        consenso_privacy_a: v.consenso_privacy_a === 'si',
        consenso_privacy_b: v.consenso_privacy_b === 'si',
        consenso_foto_realizzare: v.consenso_foto_realizzare === 'si',
        consenso_foto_utilizzare: v.consenso_foto_utilizzare === 'si',
        consenso_foto_comunicare: v.consenso_foto_comunicare === 'si',
        // Nel modulo la dichiarazione per firma di un solo genitore compare solo se firma un genitore.
        dichiarazione_firma_genitore: v.acc_qualita === 'genitore',
      })
      setInviata(valori)
      stampa()
    } catch {
      setSubmitError('Invio non riuscito. Verifica la connessione e riprova, oppure chiedi a un operatore.')
    }
  }

  const titoli = [
    'Benvenuto!',
    "Dati dell'allievo",
    'Corsi di interesse e certificazioni',
    'Informativa privacy e consensi',
    inviata ? 'Grazie!' : `Grazie, ${getValues('all_nome')} ${getValues('all_cognome')}!`,
  ]

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      <KioskHeader />
      <Progress step={step} />

      <main className="no-print mx-auto max-w-3xl px-4 pb-20 pt-8 sm:px-6">
        <h1 className="text-2xl font-black text-text sm:text-[26px]">{titoli[step]}</h1>
        {STEP_SUB[step] && <p className="mb-6 mt-1 text-[15px] text-text2">{STEP_SUB[step]}</p>}

        {step === 0 && !openDayIdParam && openDaysOggi.length > 1 && (
          <label className="mb-4 block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-text2">Open Day in corso</span>
            <select
              value={openDayId ?? ''}
              onChange={(e) => {
                setOpenDayScelto(e.target.value || undefined)
                selezionaIscritto(null)
              }}
              className="w-full rounded-il border border-border bg-white px-3 py-2 text-sm"
            >
              <option value="">Seleziona…</option>
              {openDaysOggi.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.ora.slice(0, 5)} — {o.tipo === 'OpenDay2e' ? 'Open Day 2ª edizione' : 'Open Day'}
                </option>
              ))}
            </select>
          </label>
        )}

        <FormProvider {...methods}>
          <form onSubmit={(e) => e.preventDefault()} noValidate className="space-y-5">
            {step === 0 && (
              <StepIdentificazione
                openDayId={openDayId}
                selezionato={iscritto}
                onSeleziona={selezionaIscritto}
                onAvanti={() => setStep(1)}
              />
            )}
            {step === 1 && <StepDatiAllievo precompilati={precompilati} />}
            {step === 2 && <StepCorsiCertificazioni precompilati={precompilati} />}
            {step === 3 && <StepPrivacy />}

            {step === 4 && (
              <div className="rounded-il border border-border bg-white px-6 py-12 text-center">
                <div className="mb-4 text-6xl" aria-hidden>
                  📋
                </div>
                {!inviata ? (
                  <>
                    <p className="mb-8 text-base text-text2">
                      La manifestazione d'interesse è stata compilata.
                      <br />
                      Premi il pulsante per inviarla e stamparla: l'operatore recupererà il modulo e farà apporre la
                      firma olografa.
                    </p>
                    {submitError && (
                      <div className="mb-4 text-left">
                        <ErrorBanner message={submitError} />
                      </div>
                    )}
                    <Button
                      type="button"
                      className="rounded-[10px] px-10 py-4 text-lg"
                      disabled={createMdi.isPending}
                      onClick={() => void handleSubmit(invia)()}
                    >
                      {createMdi.isPending ? 'Invio in corso…' : '🖨  Invia e Stampa'}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="mx-auto max-w-md rounded-il border border-border bg-[#f5f6f8] p-5 text-base text-text2">
                      ✅ Modulo inviato.
                      <br />
                      Recupera il documento stampato, fai apporre la firma e archivia la copia.
                    </div>
                    <div className="mt-6 flex flex-col items-center gap-3">
                      <Button type="button" variant="ghost" onClick={stampa}>
                        🖨 Stampa di nuovo
                      </Button>
                      <Button type="button" variant="success" className="rounded-[10px] px-9 py-3.5 text-base" onClick={nuovaMdi}>
                        ➕ Inserisci una nuova Manifestazione di Interesse
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {step > 0 && !inviata && (
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" className="px-7 py-3 text-[15px]" onClick={indietro}>
                  ← Indietro
                </Button>
                {step < 4 && (
                  <Button type="button" variant="blue" className="px-7 py-3 text-[15px]" onClick={() => void avanti()}>
                    Avanti →
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
