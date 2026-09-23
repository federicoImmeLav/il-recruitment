import { useFormContext } from 'react-hook-form'
import { InputField, SelectField } from '../../../components/ui/Field'
import { useCorsi } from '../../../hooks/useCorsi'
import { CANALE_CONOSCENZA_OPTIONS, dicituraCorso } from '../../../lib/constants'
import { ChoiceItem, KioskSection, PrefillBadge } from '../kioskUi'
import type { MdiFormValues } from '../mdiFormTypes'

const CERTIFICAZIONI = [
  { key: 'sostegno_asl', label: 'Collegio ASL — certifica la necessità di avere l’insegnante di sostegno' },
  { key: 'sostegno_diagnosi_funzionale', label: 'Diagnosi Funzionale Medica' },
  { key: 'sostegno_bes', label: 'BES — Bisogno Educativo Speciale' },
  { key: 'sostegno_dsa', label: 'DSA — Disturbi Specifici dell’Apprendimento' },
] as const

const PRIORITA = [
  { campo: 'corso_pref1_id', colore: 'bg-primary text-on-primary', vuoto: 'Seleziona 1ª preferenza…' },
  { campo: 'corso_pref2_id', colore: 'bg-primary-container text-on-primary-container', vuoto: 'Nessuna 2ª preferenza' },
  { campo: 'corso_pref3_id', colore: 'bg-surface-container-highest text-on-surface-variant', vuoto: 'Nessuna 3ª preferenza' },
] as const

export function StepCorsiCertificazioni({ precompilati }: { precompilati: ReadonlySet<keyof MdiFormValues> }) {
  const { data: corsi } = useCorsi()
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<MdiFormValues>()
  const [pref1, pref2, pref3, canaleAltro] = watch(['corso_pref1_id', 'corso_pref2_id', 'corso_pref3_id', 'canale_altro'])
  const scelti = [pref1, pref2, pref3]

  const nessunaReg = register('cert_nessuna', {
    validate: (v, f) =>
      v || f.sostegno_asl || f.sostegno_diagnosi_funzionale || f.sostegno_bes || f.sostegno_dsa
        ? true
        : 'Seleziona almeno una voce (o “Nessuna delle precedenti”)',
  })

  return (
    <div className="space-y-5">
      <KioskSection title="Corsi di interesse — in ordine di priorità">
        {PRIORITA.map(({ campo, colore, vuoto }, i) => (
          <div key={campo}>
            <div className="flex items-start gap-3">
              <span
                className={`mt-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-label-l ${colore}`}
              >
                {i + 1}
              </span>
              <SelectField
                label={`${i + 1}ª preferenza`}
                required={i === 0}
                className="flex-1"
                error={errors[campo]?.message}
                hint={<PrefillBadge show={precompilati.has(campo)} label="dalla registrazione" />}
                {...register(campo, i === 0 ? { required: 'Seleziona almeno la 1ª preferenza' } : {})}
              >
                <option value="">{vuoto}</option>
                {corsi
                  ?.filter((c) => c.id === scelti[i] || !scelti.slice(0, i).includes(c.id))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {dicituraCorso(c, 'breve')}
                    </option>
                  ))}
              </SelectField>
            </div>
          </div>
        ))}
      </KioskSection>

      <KioskSection title="Dichiarazione certificazioni">
        <div>
          <p className="mb-3 text-body-l text-on-surface">
            Il/la sottoscritto/a dichiara che il proprio figlio/a ha / sta usufruendo di sostegno scolastico:
          </p>
          <div className="space-y-2">
            <ChoiceItem type="radio" value="passato" label="Ha usufruito in passato di sostegno scolastico" {...register('sostegno_stato', { required: 'Seleziona una voce' })} />
            <ChoiceItem type="radio" value="presente" label="Sta usufruendo di sostegno scolastico" {...register('sostegno_stato', { required: 'Seleziona una voce' })} />
            <ChoiceItem type="radio" value="mai" label="Nessuna delle precedenti" {...register('sostegno_stato', { required: 'Seleziona una voce' })} />
          </div>
          {errors.sostegno_stato && <p className="mt-1 text-body-s text-error">{errors.sostegno_stato.message}</p>}
        </div>
        <div>
          <p className="mb-3 text-body-l text-on-surface-variant">

            Il/la sottoscritto/a dichiara che il proprio figlio/a <strong className="text-on-surface">è in possesso delle seguenti certificazioni</strong>:
          </p>
          <div className="space-y-2">
            {CERTIFICAZIONI.map(({ key, label }) => {
              const reg = register(key)
              return (
                <ChoiceItem
                  key={key}
                  label={label}
                  {...reg}
                  onChange={(e) => {
                    void reg.onChange(e)
                    if (e.target.checked) setValue('cert_nessuna', false)
                  }}
                />
              )
            })}
            <ChoiceItem
              label="Nessuna delle precedenti"
              {...nessunaReg}
              onChange={(e) => {
                void nessunaReg.onChange(e)
                if (e.target.checked) CERTIFICAZIONI.forEach(({ key }) => setValue(key, false))
              }}
            />
          </div>
          {errors.cert_nessuna && <p className="mt-1 text-body-s text-error">{errors.cert_nessuna.message}</p>}
        </div>
      </KioskSection>

      <KioskSection title="Come avete conosciuto la nostra scuola?">
        <div className="space-y-2">
          {CANALE_CONOSCENZA_OPTIONS.map((opt) => (
            <ChoiceItem key={opt.key} label={opt.label} {...register(opt.key)} />
          ))}
        </div>
        {canaleAltro && (
          <InputField
            label="Specificare"
            placeholder="es. Consigliato dall'istituto scolastico"
            required
            error={errors.canale_altro_testo?.message}
            {...register('canale_altro_testo', {
              validate: (v, f) => !f.canale_altro || !!v.trim() || 'Specifica come ci avete conosciuto',
            })}
          />
        )}
      </KioskSection>
    </div>
  )
}
