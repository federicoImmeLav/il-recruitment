import { useFormContext } from 'react-hook-form'
import { CheckboxField, InputField, SelectField } from '../../../components/ui/Field'
import type { MdiFormValues } from '../mdiFormTypes'

export function StepAllievo() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<MdiFormValues>()

  const domicilioDiverso = watch('all_domicilio_diverso')

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField label="Cognome" required error={errors.all_cognome?.message} {...register('all_cognome', { required: 'Campo obbligatorio' })} />
        <InputField label="Nome" required error={errors.all_nome?.message} {...register('all_nome', { required: 'Campo obbligatorio' })} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <InputField
          label="Data di nascita"
          type="date"
          required
          error={errors.all_data_nascita?.message}
          {...register('all_data_nascita', { required: 'Campo obbligatorio' })}
        />
        <SelectField label="Annualità" required error={errors.all_annualita?.message} {...register('all_annualita', { required: 'Campo obbligatorio' })}>
          <option value="">Seleziona…</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}ª
            </option>
          ))}
        </SelectField>
        <InputField label="Sezione" maxLength={1} {...register('all_sezione')} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField label="Nato/a a" required error={errors.all_nato_a?.message} {...register('all_nato_a', { required: 'Campo obbligatorio' })} />
        <InputField
          label="Cittadinanza"
          required
          error={errors.all_cittadinanza?.message}
          {...register('all_cittadinanza', { required: 'Campo obbligatorio' })}
        />
      </div>
      <InputField label="Scuola di provenienza" {...register('all_scuola_provenienza')} />

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-text2">Residenza</p>
        <div className="space-y-3">
          <InputField
            label="Via e numero civico"
            required
            error={errors.all_residenza_via?.message}
            {...register('all_residenza_via', { required: 'Campo obbligatorio' })}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <InputField
              label="Città"
              required
              error={errors.all_residenza_citta?.message}
              {...register('all_residenza_citta', { required: 'Campo obbligatorio' })}
            />
            <InputField label="Provincia" maxLength={2} {...register('all_residenza_prov')} />
            <InputField label="CAP" {...register('all_residenza_cap')} />
          </div>
        </div>
      </div>

      <CheckboxField label="Il domicilio è diverso dalla residenza" {...register('all_domicilio_diverso')} />

      {domicilioDiverso && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-text2">Domicilio</p>
          <div className="space-y-3">
            <InputField label="Via e numero civico" {...register('all_domicilio_via')} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <InputField label="Città" {...register('all_domicilio_citta')} />
              <InputField label="Provincia" maxLength={2} {...register('all_domicilio_prov')} />
              <InputField label="CAP" {...register('all_domicilio_cap')} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
