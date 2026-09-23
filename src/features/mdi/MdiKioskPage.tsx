import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { FormProvider, useForm } from 'react-hook-form'
import { PublicLayout } from '../../components/layout/PublicLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { ErrorBanner } from '../../components/ui/Spinner'
import { useCreateMdi } from '../../hooks/useMdi'
import { MDI_DEFAULT_VALUES, STEP_FIELDS, STEP_TITLES, type MdiFormValues } from './mdiFormTypes'
import { StepAccompagnatore } from './steps/StepAccompagnatore'
import { StepAllievo } from './steps/StepAllievo'
import { StepCorsi } from './steps/StepCorsi'
import { StepSostegno } from './steps/StepSostegno'
import { StepPrivacy } from './steps/StepPrivacy'

const STEPS = [StepAccompagnatore, StepAllievo, StepCorsi, StepSostegno, StepPrivacy]

function ProgressBar({ step }: { step: number }) {
  const pct = ((step + 1) / STEPS.length) * 100
  return (
    <div className="mb-4">
      <div className="mb-1 flex justify-between text-xs font-bold text-text3">
        <span>
          Passo {step + 1} di {STEPS.length}
        </span>
        <span>{STEP_TITLES[step]}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-light">
        <div className="h-full rounded-full bg-orange transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function MdiKioskPage() {
  const { openDayId } = useParams<{ openDayId?: string }>()
  const [step, setStep] = useState(0)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const createMdi = useCreateMdi()

  const methods = useForm<MdiFormValues>({ defaultValues: MDI_DEFAULT_VALUES, mode: 'onBlur' })
  const { handleSubmit, trigger } = methods

  const StepComponent = STEPS[step]
  const isLastStep = step === STEPS.length - 1

  async function goNext() {
    const valid = await trigger(STEP_FIELDS[step])
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0))
  }

  async function onSubmit(values: MdiFormValues) {
    setSubmitError(null)
    try {
      await createMdi.mutateAsync({
        open_day_id: openDayId ?? null,
        booking_id: null,
        acc_cognome: values.acc_cognome,
        acc_nome: values.acc_nome,
        acc_qualita: values.acc_qualita as 'genitore' | 'tutore',
        acc_cellulare: values.acc_cellulare,
        acc_email: values.acc_email,
        all_cognome: values.all_cognome,
        all_nome: values.all_nome,
        all_data_nascita: values.all_data_nascita,
        all_annualita: Number(values.all_annualita),
        all_sezione: values.all_sezione || null,
        all_nato_a: values.all_nato_a,
        all_cittadinanza: values.all_cittadinanza,
        all_scuola_provenienza: values.all_scuola_provenienza || null,
        all_residenza_via: values.all_residenza_via,
        all_residenza_citta: values.all_residenza_citta,
        all_residenza_prov: values.all_residenza_prov || null,
        all_residenza_cap: values.all_residenza_cap || null,
        all_domicilio_diverso: values.all_domicilio_diverso,
        all_domicilio_via: values.all_domicilio_diverso ? values.all_domicilio_via || null : null,
        all_domicilio_citta: values.all_domicilio_diverso ? values.all_domicilio_citta || null : null,
        all_domicilio_prov: values.all_domicilio_diverso ? values.all_domicilio_prov || null : null,
        all_domicilio_cap: values.all_domicilio_diverso ? values.all_domicilio_cap || null : null,
        corso_pref1_id: values.corso_pref1_id || null,
        corso_pref2_id: values.corso_pref2_id || null,
        corso_pref3_id: values.corso_pref3_id || null,
        sostegno_stato: values.sostegno_stato,
        sostegno_asl: values.sostegno_asl,
        sostegno_diagnosi_funzionale: values.sostegno_diagnosi_funzionale,
        sostegno_bes: values.sostegno_bes,
        sostegno_dsa: values.sostegno_dsa,
        canale_orientamento_scuola: values.canale_orientamento_scuola,
        canale_open_day: values.canale_open_day,
        canale_ricerca_online: values.canale_ricerca_online,
        canale_passaparola: values.canale_passaparola,
        canale_altro: values.canale_altro,
        canale_altro_testo: values.canale_altro ? values.canale_altro_testo || null : null,
        consenso_foto_realizzare: values.consenso_foto_realizzare,
        consenso_foto_utilizzare: values.consenso_foto_utilizzare,
        consenso_foto_comunicare: values.consenso_foto_comunicare,
        dichiarazione_firma_genitore: values.dichiarazione_firma_genitore,
      })
      setDone(true)
    } catch {
      setSubmitError('Invio non riuscito. Verifica la connessione e riprova.')
    }
  }

  if (done) {
    return (
      <PublicLayout>
        <Card className="text-center">
          <h1 className="text-lg font-bold text-text">Manifestazione di Interesse inviata</h1>
          <p className="mt-2 text-sm text-text2">
            Grazie! Un operatore prenderà in carico la richiesta. Se richiesto dalla scuola, ricordati di far firmare
            la copia cartacea.
          </p>
        </Card>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      <Card>
        <h1 className="mb-1 text-lg font-bold text-text">Manifestazione di Interesse</h1>
        <p className="mb-4 text-sm text-text3">Compila tutti i campi obbligatori (*)</p>
        <ProgressBar step={step} />
        <FormProvider {...methods}>
          <form
            onSubmit={isLastStep ? handleSubmit(onSubmit) : (e) => e.preventDefault()}
            className="space-y-6"
          >
            <StepComponent />

            {submitError && <ErrorBanner message={submitError} />}

            <div className="flex justify-between gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={goBack} disabled={step === 0}>
                Indietro
              </Button>
              {isLastStep ? (
                <Button type="submit" disabled={createMdi.isPending}>
                  {createMdi.isPending ? 'Invio in corso…' : 'Invia MDI'}
                </Button>
              ) : (
                <Button type="button" onClick={() => void goNext()}>
                  Avanti
                </Button>
              )}
            </div>
          </form>
        </FormProvider>
      </Card>
    </PublicLayout>
  )
}
