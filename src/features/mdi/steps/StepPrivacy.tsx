import { useFormContext } from 'react-hook-form'
import { CheckboxField } from '../../../components/ui/Field'
import type { MdiFormValues } from '../mdiFormTypes'

export function StepPrivacy() {
  const {
    register,
    formState: { errors },
  } = useFormContext<MdiFormValues>()

  return (
    <div className="space-y-5">
      <div className="max-h-40 overflow-y-auto rounded-il border border-border bg-gray-xl p-3 text-xs text-text2">
        <p className="mb-2 font-bold">Informativa privacy (art. 13 GDPR)</p>
        <p>
          I dati personali raccolti tramite questo modulo sono trattati da Immaginazione e Lavoro per finalità di
          orientamento e gestione del percorso IeFP, nel rispetto del Regolamento (UE) 2016/679. I dati non saranno
          diffusi e potranno essere comunicati agli enti coinvolti nella gestione del corso. Il conferimento dei dati
          è necessario per la partecipazione alle attività di orientamento e iscrizione.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wide text-text2">Consenso foto/video</p>
        <CheckboxField label="Autorizzo a realizzare foto/video durante le attività" {...register('consenso_foto_realizzare')} />
        <CheckboxField label="Autorizzo a utilizzare foto/video a scopo didattico/promozionale" {...register('consenso_foto_utilizzare')} />
        <CheckboxField label="Autorizzo a comunicare foto/video a terzi per finalità istituzionali" {...register('consenso_foto_comunicare')} />
      </div>

      <CheckboxField
        label="Dichiaro, in qualità di genitore/tutore, di aver letto l'informativa e di confermare i dati inseriti."
        {...register('dichiarazione_firma_genitore', { required: 'Conferma necessaria per procedere' })}
      />
      {errors.dichiarazione_firma_genitore && (
        <p className="text-xs text-red">{errors.dichiarazione_firma_genitore.message}</p>
      )}
      <p className="text-xs text-text3">La firma olografa viene raccolta su copia stampata, se richiesta dalla scuola/ente.</p>
    </div>
  )
}
