import { useFormContext } from 'react-hook-form'
import { CheckboxField, InputField } from '../../../components/ui/Field'
import { CANALE_CONOSCENZA_OPTIONS } from '../../../lib/constants'
import type { MdiFormValues } from '../mdiFormTypes'

export function StepSostegno() {
  const { register, watch } = useFormContext<MdiFormValues>()
  const canaleAltro = watch('canale_altro')

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-text2">Sostegno / certificazioni</p>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" value="mai" className="accent-orange" {...register('sostegno_stato')} />
            Nessun sostegno
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" value="passato" className="accent-orange" {...register('sostegno_stato')} />
            Sostegno usufruito in passato
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" value="presente" className="accent-orange" {...register('sostegno_stato')} />
            Sostegno attuale
          </label>
        </div>
        <div className="mt-3 space-y-2 pl-1">
          <CheckboxField label="ASL sostegno" {...register('sostegno_asl')} />
          <CheckboxField label="Diagnosi Funzionale" {...register('sostegno_diagnosi_funzionale')} />
          <CheckboxField label="BES" {...register('sostegno_bes')} />
          <CheckboxField label="DSA" {...register('sostegno_dsa')} />
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-text2">Come ci hai conosciuto?</p>
        <div className="space-y-2">
          {CANALE_CONOSCENZA_OPTIONS.map((opt) => (
            <CheckboxField key={opt.key} label={opt.label} {...register(opt.key as keyof MdiFormValues)} />
          ))}
        </div>
        {canaleAltro && (
          <div className="mt-2">
            <InputField label="Specifica" {...register('canale_altro_testo')} />
          </div>
        )}
      </div>
    </div>
  )
}
