import { useFormContext } from 'react-hook-form'
import { CheckboxField, InputField } from '../../../components/ui/Field'
import { CampoCodiceFiscale, CampoComune, CampoLuogoNascita, SelectPaese } from '../campiAnagrafici'
import { ChoiceItem, KioskSection, PrefillBadge } from '../kioskUi'
import type { MdiFormValues } from '../mdiFormTypes'

const obbligatorio = { required: 'Campo obbligatorio' }
const email = { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email non valida' }

/** Genitore/tutore firmatario: corrisponde al "primo genitore" dell'anagrafica INNOVAPLAN. */
export function StepGenitore({ precompilati }: { precompilati: ReadonlySet<keyof MdiFormValues> }) {
  const {
    register,
    watch,
    getValues,
    formState: { errors },
  } = useFormContext<MdiFormValues>()
  const comeAllievo = watch('acc_residenza_come_allievo')
  const badge = (campo: keyof MdiFormValues) => <PrefillBadge show={precompilati.has(campo)} />
  const residenzaPropria = () => !getValues('acc_residenza_come_allievo')

  return (
    <div className="space-y-5">
      <KioskSection title="Genitore / tutore che firma il modulo">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField label="Cognome" required error={errors.acc_cognome?.message} hint={badge('acc_cognome')} {...register('acc_cognome', obbligatorio)} />
          <InputField label="Nome" required error={errors.acc_nome?.message} hint={badge('acc_nome')} {...register('acc_nome', obbligatorio)} />
        </div>
        <div>
          <p className="mb-2 text-body-m text-on-surface-variant">
            In qualità di *
          </p>
          <div className="grid grid-cols-2 gap-3">
            <ChoiceItem type="radio" value="genitore" label={<strong>Genitore</strong>} {...register('acc_qualita', obbligatorio)} />
            <ChoiceItem type="radio" value="tutore" label={<strong>Tutore</strong>} {...register('acc_qualita', obbligatorio)} />
          </div>
          {errors.acc_qualita && <p className="mt-1 text-body-s text-error">{errors.acc_qualita.message}</p>}
        </div>
        <CampoCodiceFiscale
          campo="acc_codice_fiscale"
          label="Codice fiscale del genitore/tutore"
          campi={{
            sesso: 'acc_sesso',
            data: 'acc_data_nascita',
            nascita: 'acc_nascita',
            comune: 'acc_comune_nascita',
            comuneCod: 'acc_comune_nascita_cod',
            stato: 'acc_stato_nascita',
          }}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-body-m text-on-surface-variant">
              Sesso *
            </p>
            <div className="grid grid-cols-2 gap-3">
              <ChoiceItem type="radio" value="M" label={<strong>Maschio</strong>} {...register('acc_sesso', obbligatorio)} />
              <ChoiceItem type="radio" value="F" label={<strong>Femmina</strong>} {...register('acc_sesso', obbligatorio)} />
            </div>
            {errors.acc_sesso && <p className="mt-1 text-body-s text-error">{errors.acc_sesso.message}</p>}
          </div>
          <InputField
            label="Data di nascita"
            type="date"
            required
            error={errors.acc_data_nascita?.message}
            {...register('acc_data_nascita', obbligatorio)}
          />
        </div>
        <CampoLuogoNascita nascita="acc_nascita" comune="acc_comune_nascita" comuneCod="acc_comune_nascita_cod" stato="acc_stato_nascita" />
        <SelectPaese campo="acc_cittadinanza" label="Cittadinanza" required />
      </KioskSection>

      <KioskSection title="Contatti">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField
            label="Cellulare"
            type="tel"
            inputMode="tel"
            required
            error={errors.acc_cellulare?.message}
            hint={badge('acc_cellulare')}
            {...register('acc_cellulare', {
              ...obbligatorio,
              pattern: { value: /^[+\d][\d\s./-]{5,}$/, message: 'Numero non valido' },
            })}
          />
          <InputField
            label="Email"
            type="email"
            inputMode="email"
            placeholder="nome@email.it"
            required
            error={errors.acc_email?.message}
            hint={badge('acc_email')}
            {...register('acc_email', { ...obbligatorio, pattern: email })}
          />
        </div>
        <InputField
          label="Seconda email (facoltativa)"
          type="email"
          inputMode="email"
          error={errors.acc_email_2?.message}
          {...register('acc_email_2', { pattern: email })}
        />
      </KioskSection>

      <KioskSection title="Residenza del genitore/tutore">
        <CheckboxField label="Stessa residenza dell'allievo" {...register('acc_residenza_come_allievo')} />
        {!comeAllievo && (
          <>
            <InputField
              label="Residente in Via"
              placeholder="Via/Piazza e numero civico"
              required
              error={errors.acc_residenza_via?.message}
              {...register('acc_residenza_via', {
                validate: (v, f) => f.acc_residenza_come_allievo || !!v.trim() || 'Campo obbligatorio',
              })}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <CampoComune
                  nome="acc_residenza_citta"
                  cod="acc_residenza_comune_cod"
                  prov="acc_residenza_prov"
                  label="Comune"
                  required
                  attivo={residenzaPropria}
                />
              </div>
              <InputField label="Prov" maxLength={2} readOnly tabIndex={-1} className="[&_input]:uppercase [&_input]:text-on-surface-variant" {...register('acc_residenza_prov')} />
              <InputField
                label="CAP"
                maxLength={5}
                inputMode="numeric"
                required
                error={errors.acc_residenza_cap?.message}
                {...register('acc_residenza_cap', {
                  validate: (v, f) =>
                    f.acc_residenza_come_allievo || /^\d{5}$/.test(v.trim()) || 'CAP di 5 cifre',
                })}
              />
            </div>
          </>
        )}
      </KioskSection>
    </div>
  )
}
