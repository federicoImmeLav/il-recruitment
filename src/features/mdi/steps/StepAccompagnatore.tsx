import { useFormContext } from 'react-hook-form'
import { InputField, SelectField } from '../../../components/ui/Field'
import type { MdiFormValues } from '../mdiFormTypes'

export function StepAccompagnatore() {
  const {
    register,
    formState: { errors },
  } = useFormContext<MdiFormValues>()

  return (
    <div className="space-y-4">
      <p className="text-sm text-text2">Dati di chi accompagna l’allievo/a (genitore o tutore legale).</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField label="Cognome" required error={errors.acc_cognome?.message} {...register('acc_cognome', { required: 'Campo obbligatorio' })} />
        <InputField label="Nome" required error={errors.acc_nome?.message} {...register('acc_nome', { required: 'Campo obbligatorio' })} />
      </div>
      <SelectField label="Qualità" required error={errors.acc_qualita?.message} {...register('acc_qualita', { required: 'Campo obbligatorio' })}>
        <option value="">Seleziona…</option>
        <option value="genitore">Genitore</option>
        <option value="tutore">Tutore</option>
      </SelectField>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField
          label="Cellulare"
          type="tel"
          required
          error={errors.acc_cellulare?.message}
          {...register('acc_cellulare', { required: 'Campo obbligatorio' })}
        />
        <InputField
          label="Email"
          type="email"
          required
          error={errors.acc_email?.message}
          {...register('acc_email', { required: 'Campo obbligatorio' })}
        />
      </div>
    </div>
  )
}
