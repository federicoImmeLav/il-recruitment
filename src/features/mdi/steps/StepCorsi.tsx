import { useFormContext } from 'react-hook-form'
import { SelectField } from '../../../components/ui/Field'
import { useCorsi } from '../../../hooks/useCorsi'
import type { MdiFormValues } from '../mdiFormTypes'

export function StepCorsi() {
  const { data: corsi } = useCorsi()
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<MdiFormValues>()

  const pref1 = watch('corso_pref1_id')
  const pref2 = watch('corso_pref2_id')

  return (
    <div className="space-y-4">
      <p className="text-sm text-text2">Indica fino a 3 corsi in ordine di preferenza.</p>
      <SelectField
        label="1ª preferenza"
        required
        error={errors.corso_pref1_id?.message}
        {...register('corso_pref1_id', { required: 'Seleziona almeno una preferenza' })}
      >
        <option value="">Seleziona…</option>
        {corsi?.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nome}
          </option>
        ))}
      </SelectField>
      <SelectField label="2ª preferenza" {...register('corso_pref2_id')}>
        <option value="">Nessuna</option>
        {corsi?.filter((c) => c.id !== pref1).map((c) => (
          <option key={c.id} value={c.id}>
            {c.nome}
          </option>
        ))}
      </SelectField>
      <SelectField label="3ª preferenza" {...register('corso_pref3_id')}>
        <option value="">Nessuna</option>
        {corsi?.filter((c) => c.id !== pref1 && c.id !== pref2).map((c) => (
          <option key={c.id} value={c.id}>
            {c.nome}
          </option>
        ))}
      </SelectField>
    </div>
  )
}
