import { useFormContext } from 'react-hook-form'
import { CheckboxField, InputField, SelectField } from '../../../components/ui/Field'
import { CampoCodiceFiscale, CampoComune, CampoLuogoNascita, CampoScuolaProvenienza, SelectPaese } from '../campiAnagrafici'
import { ChoiceItem, KioskSection, PrefillBadge } from '../kioskUi'
import { SEZIONI, type MdiFormValues } from '../mdiFormTypes'

const obbligatorio = { required: 'Campo obbligatorio' }

export function StepDatiAllievo({ precompilati }: { precompilati: ReadonlySet<keyof MdiFormValues> }) {
  const {
    register,
    watch,
    getValues,
    formState: { errors },
  } = useFormContext<MdiFormValues>()
  const domicilioDiverso = watch('all_domicilio_diverso')
  const badge = (campo: keyof MdiFormValues) => <PrefillBadge show={precompilati.has(campo)} />
  const conDomicilio = () => getValues('all_domicilio_diverso')

  return (
    <div className="space-y-5">
      <KioskSection title="Dati anagrafici allievo">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField label="Cognome" required error={errors.all_cognome?.message} hint={badge('all_cognome')} {...register('all_cognome', obbligatorio)} />
          <InputField label="Nome" required error={errors.all_nome?.message} hint={badge('all_nome')} {...register('all_nome', obbligatorio)} />
        </div>
        <CampoCodiceFiscale
          campo="all_codice_fiscale"
          label="Codice fiscale dell'allievo"
          campi={{
            sesso: 'all_sesso',
            data: 'all_data_nascita',
            nascita: 'all_nascita',
            comune: 'all_nato_a',
            comuneCod: 'all_comune_nascita_cod',
            stato: 'all_stato_nascita',
          }}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-body-m text-on-surface-variant">
              Sesso *
            </p>
            <div className="grid grid-cols-2 gap-3">
              <ChoiceItem type="radio" value="M" label={<strong>Maschio</strong>} {...register('all_sesso', obbligatorio)} />
              <ChoiceItem type="radio" value="F" label={<strong>Femmina</strong>} {...register('all_sesso', obbligatorio)} />
            </div>
            {errors.all_sesso && <p className="mt-1 text-body-s text-error">{errors.all_sesso.message}</p>}
          </div>
          <InputField
            label="Data di nascita"
            type="date"
            required
            error={errors.all_data_nascita?.message}
            hint={badge('all_data_nascita')}
            {...register('all_data_nascita', obbligatorio)}
          />
        </div>
        <CampoLuogoNascita nascita="all_nascita" comune="all_nato_a" comuneCod="all_comune_nascita_cod" stato="all_stato_nascita" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectPaese campo="all_cittadinanza" label="Cittadinanza" required />
          <SelectPaese campo="all_cittadinanza_2" label="Seconda cittadinanza" vuoto="Nessuna" />
        </div>
      </KioskSection>

      <KioskSection title="Scuola di provenienza">
        <CampoScuolaProvenienza />
        <div className="grid grid-cols-2 gap-4">
          <SelectField label="Annualità" required error={errors.all_annualita?.message} {...register('all_annualita', obbligatorio)}>
            <option value="">—</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}°
              </option>
            ))}
          </SelectField>
          <SelectField label="Sezione" required error={errors.all_sezione?.message} {...register('all_sezione', obbligatorio)}>
            <option value="">—</option>
            {SEZIONI.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </SelectField>
        </div>
      </KioskSection>

      <KioskSection title="Residenza">
        <InputField
          label="Residente in Via"
          placeholder="Via/Piazza e numero civico"
          required
          error={errors.all_residenza_via?.message}
          {...register('all_residenza_via', obbligatorio)}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <CampoComune nome="all_residenza_citta" cod="all_residenza_comune_cod" prov="all_residenza_prov" label="Comune" required />
          </div>
          <InputField label="Prov" maxLength={2} readOnly tabIndex={-1} className="[&_input]:uppercase [&_input]:text-on-surface-variant" {...register('all_residenza_prov')} />
          <InputField
            label="CAP"
            maxLength={5}
            inputMode="numeric"
            required
            error={errors.all_residenza_cap?.message}
            {...register('all_residenza_cap', { ...obbligatorio, pattern: { value: /^\d{5}$/, message: '5 cifre' } })}
          />
        </div>

        <CheckboxField label="Il domicilio è diverso dalla residenza" {...register('all_domicilio_diverso')} />
        {domicilioDiverso && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <InputField
                label="Domiciliato in Via"
                required
                error={errors.all_domicilio_via?.message}
                {...register('all_domicilio_via', { validate: (v, f) => !f.all_domicilio_diverso || !!v.trim() || 'Campo obbligatorio' })}
              />
            </div>
            <CampoComune
              nome="all_domicilio_citta"
              cod="all_domicilio_comune_cod"
              prov="all_domicilio_prov"
              label="Comune"
              required
              attivo={conDomicilio}
            />
            <InputField label="CAP" maxLength={5} inputMode="numeric" {...register('all_domicilio_cap')} />
          </div>
        )}
      </KioskSection>
    </div>
  )
}
