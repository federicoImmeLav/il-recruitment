import { useFormContext } from 'react-hook-form'
import { CheckboxField, InputField, SelectField } from '../../../components/ui/Field'
import { ChoiceItem, KioskSection, PrefillBadge } from '../kioskUi'
import { SEZIONI, type MdiFormValues } from '../mdiFormTypes'

const obbligatorio = { required: 'Campo obbligatorio' }

export function StepDatiAllievo({ precompilati }: { precompilati: ReadonlySet<keyof MdiFormValues> }) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<MdiFormValues>()
  const domicilioDiverso = watch('all_domicilio_diverso')
  const badge = (campo: keyof MdiFormValues) => <PrefillBadge show={precompilati.has(campo)} />

  return (
    <div className="space-y-5">
      <KioskSection title="Accompagnatore firmatario">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField label="Cognome" required error={errors.acc_cognome?.message} hint={badge('acc_cognome')} {...register('acc_cognome', obbligatorio)} />
          <InputField label="Nome" required error={errors.acc_nome?.message} hint={badge('acc_nome')} {...register('acc_nome', obbligatorio)} />
        </div>
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-text2">
            In qualità di<span className="text-red"> *</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <ChoiceItem type="radio" value="genitore" label={<strong>Genitore</strong>} {...register('acc_qualita', obbligatorio)} />
            <ChoiceItem type="radio" value="tutore" label={<strong>Tutore</strong>} {...register('acc_qualita', obbligatorio)} />
          </div>
          {errors.acc_qualita && <p className="mt-1 text-xs text-red">{errors.acc_qualita.message}</p>}
        </div>
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
            label="Email genitore"
            type="email"
            inputMode="email"
            placeholder="nome@email.it"
            required
            error={errors.acc_email?.message}
            hint={badge('acc_email')}
            {...register('acc_email', {
              ...obbligatorio,
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email non valida' },
            })}
          />
        </div>
      </KioskSection>

      <KioskSection title="Dati anagrafici allievo">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <InputField label="Cognome" required error={errors.all_cognome?.message} hint={badge('all_cognome')} {...register('all_cognome', obbligatorio)} />
          <InputField label="Nome" required error={errors.all_nome?.message} hint={badge('all_nome')} {...register('all_nome', obbligatorio)} />
          <InputField
            label="Data di nascita"
            type="date"
            required
            error={errors.all_data_nascita?.message}
            hint={badge('all_data_nascita')}
            {...register('all_data_nascita', obbligatorio)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
          <InputField label="Nato/a a" placeholder="es. Milano" required error={errors.all_nato_a?.message} {...register('all_nato_a', obbligatorio)} />
          <InputField
            label="Cittadinanza"
            placeholder="es. Italiana"
            required
            error={errors.all_cittadinanza?.message}
            {...register('all_cittadinanza', obbligatorio)}
          />
        </div>
        <InputField label="Scuola di provenienza" hint={badge('all_scuola_provenienza')} {...register('all_scuola_provenienza')} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <InputField
              label="Residente in Via"
              placeholder="Via/Piazza e numero civico"
              required
              error={errors.all_residenza_via?.message}
              {...register('all_residenza_via', obbligatorio)}
            />
          </div>
          <InputField label="Città" required error={errors.all_residenza_citta?.message} {...register('all_residenza_citta', obbligatorio)} />
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Prov"
              maxLength={2}
              placeholder="MI"
              className="uppercase"
              error={errors.all_residenza_prov?.message}
              {...register('all_residenza_prov', {
                pattern: { value: /^[A-Za-z]{2}$/, message: '2 lettere' },
              })}
            />
            <InputField
              label="CAP"
              maxLength={5}
              inputMode="numeric"
              error={errors.all_residenza_cap?.message}
              {...register('all_residenza_cap', { pattern: { value: /^\d{5}$/, message: '5 cifre' } })}
            />
          </div>
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
            <InputField
              label="Città"
              required
              error={errors.all_domicilio_citta?.message}
              {...register('all_domicilio_citta', { validate: (v, f) => !f.all_domicilio_diverso || !!v.trim() || 'Campo obbligatorio' })}
            />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Prov" maxLength={2} className="uppercase" {...register('all_domicilio_prov')} />
              <InputField label="CAP" maxLength={5} inputMode="numeric" {...register('all_domicilio_cap')} />
            </div>
          </div>
        )}
      </KioskSection>
    </div>
  )
}
