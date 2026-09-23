import { useState } from 'react'
import { useController, useFormContext, useWatch } from 'react-hook-form'
import { Autocomplete } from '../../components/ui/Autocomplete'
import { Icon } from '../../components/ui/Icon'
import { InputField, SelectField } from '../../components/ui/Field'
import { analizzaCf } from '../../lib/codiceFiscale'
import {
  ITALIA,
  PAESI,
  cercaComuni,
  cercaScuole,
  paesePerCodice,
  useComuni,
  useScuoleMedie,
  type Comune,
  type Scuola,
} from '../../lib/riferimenti'
import { ChoiceItem } from './kioskUi'
import type { MdiFormValues } from './mdiFormTypes'

type Campo = keyof MdiFormValues
type CampoTesto = {
  [K in Campo]: MdiFormValues[K] extends string ? K : never
}[Campo]

// ---------------------------------------------------------------------------
// Codice fiscale: valida e compila sesso, data e luogo di nascita.
// ---------------------------------------------------------------------------

interface CampiDaCf {
  sesso: CampoTesto
  data: CampoTesto
  nascita: 'all_nascita' | 'acc_nascita'
  comune: CampoTesto
  comuneCod: CampoTesto
  stato: CampoTesto
}

export function CampoCodiceFiscale({ campo, campi, label }: { campo: CampoTesto; campi: CampiDaCf; label: string }) {
  const { register, setValue, control, formState } = useFormContext<MdiFormValues>()
  const { data: comuni } = useComuni()
  const [compilati, setCompilati] = useState(false)
  const [cf, sesso, data] = useWatch({ control, name: [campo, campi.sesso, campi.data] })
  const esito = analizzaCf(cf)
  const errore = formState.errors[campo]?.message

  const incoerenze =
    esito.stato === 'valido'
      ? [
          sesso && sesso !== esito.sesso && 'sesso',
          data && data !== esito.dataNascita && 'data di nascita',
        ].filter(Boolean)
      : []

  function compila(valore: string) {
    const e = analizzaCf(valore)
    if (e.stato !== 'valido') return
    const opts = { shouldValidate: true, shouldDirty: true }
    setValue(campi.sesso, e.sesso, opts)
    setValue(campi.data, e.dataNascita, opts)
    if (e.estero) {
      setValue(campi.nascita, 'estero', opts)
      const paese = paesePerCodice(e.codiceLuogo)
      if (paese) setValue(campi.stato, paese.nome, opts)
      setValue(campi.comuneCod, '', opts)
    } else {
      setValue(campi.nascita, 'italia', opts)
      // Il codice catastale viene dal CF anche se il comune non e' piu' nell'elenco (soppresso).
      setValue(campi.comuneCod, e.codiceLuogo, opts)
      const comune = comuni?.find((c) => c.codice === e.codiceLuogo)
      if (comune) setValue(campi.comune, comune.nome, opts)
    }
    setCompilati(true)
  }

  const reg = register(campo, {
    setValueAs: (v: string) => v.replace(/\s/g, '').toUpperCase(),
    validate: (v) => {
      const e = analizzaCf(v)
      if (e.stato === 'vuoto') return 'Campo obbligatorio'
      if (e.stato === 'non_valido') return e.motivo
      return true
    },
  })

  return (
    <div>
      <InputField
        label={label}
        required
        maxLength={20}
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        className="[&_input]:font-mono [&_input]:uppercase [&_input]:tracking-wider"
        error={errore}
        {...reg}
        onChange={(e) => {
          void reg.onChange(e)
          compila(e.target.value)
        }}
      />
      {esito.stato === 'valido' && compilati && incoerenze.length === 0 && (
        <p className="mt-1 flex items-start gap-1 px-4 text-body-s text-success"><Icon name="check_circle" size={16} filled />Sesso, data e luogo di nascita compilati dal codice fiscale</p>
      )}
      {esito.stato === 'non_standard' && (
        <p className="mt-1 flex items-start gap-1 px-4 text-body-s text-on-warning-container">Codice non standard (es. provvisorio): verrà accettato così com'è.</p>
      )}
      {incoerenze.length > 0 && (
        <p className="mt-1 flex items-start gap-1 px-4 text-body-s text-on-warning-container">
          Attenzione: {incoerenze.join(' e ')} non corrispondono al codice fiscale. Controlla.
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Comune (autocomplete sull'elenco ISTAT): nome + codice catastale (+ provincia).
// ---------------------------------------------------------------------------

export function CampoComune({
  nome,
  cod,
  prov,
  label,
  required,
  attivo = () => true,
}: {
  nome: CampoTesto
  cod: CampoTesto
  prov?: CampoTesto
  label: string
  required?: boolean
  /**
   * Se restituisce false (es. nato all'estero) la validazione e' sospesa. E' una
   * funzione perche' React Hook Form conserva le regole anche a campo nascosto.
   */
  attivo?: () => boolean
}) {
  const { setValue, getValues } = useFormContext<MdiFormValues>()
  const { data: comuni, isLoading } = useComuni()
  const { field, fieldState } = useController<MdiFormValues, CampoTesto>({
    name: nome,
    rules: {
      validate: (v) => {
        if (!attivo()) return true
        if (!v.trim()) return required ? 'Campo obbligatorio' : true
        return getValues(cod) ? true : 'Scegli il comune dall’elenco'
      },
    },
  })

  return (
    <Autocomplete<Comune>
      label={label}
      required={required}
      placeholder="Inizia a scrivere…"
      value={field.value}
      error={fieldState.error?.message}
      caricamento={isLoading}
      suggerimenti={(t) => (comuni ? cercaComuni(comuni, t) : [])}
      chiave={(c) => c.codice}
      renderItem={(c) => (
        <>
          <span className="font-bold">{c.nome}</span> <span className="text-on-surface-variant">({c.prov})</span>
        </>
      )}
      onTesto={(t) => {
        field.onChange(t)
        setValue(cod, '')
      }}
      onScegli={(c) => {
        setValue(cod, c.codice)
        if (prov) setValue(prov, c.prov, { shouldDirty: true })
        field.onChange(c.nome)
      }}
      onBlur={field.onBlur}
      vuoto="Nessun comune trovato"
    />
  )
}

// ---------------------------------------------------------------------------
// Paese (cittadinanza / stato di nascita)
// ---------------------------------------------------------------------------

export function SelectPaese({
  campo,
  label,
  required,
  escludiItalia,
  vuoto = 'Seleziona…',
  attivo = () => true,
}: {
  campo: CampoTesto
  label: string
  required?: boolean
  escludiItalia?: boolean
  vuoto?: string
  /** Vedi CampoComune: validazione solo se il campo e' pertinente. */
  attivo?: () => boolean
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext<MdiFormValues>()
  return (
    <SelectField
      label={label}
      required={required}
      error={errors[campo]?.message}
      {...register(campo, {
        validate: (v) => !required || !attivo() || !!v || 'Campo obbligatorio',
      })}
    >
      <option value="">{vuoto}</option>
      {PAESI.filter((p) => !escludiItalia || p.nome !== ITALIA).map((p) => (
        <option key={p.nome} value={p.nome}>
          {p.nome}
        </option>
      ))}
    </SelectField>
  )
}

// ---------------------------------------------------------------------------
// Luogo di nascita: Italia (comune) o estero (paese)
// ---------------------------------------------------------------------------

export function CampoLuogoNascita({
  nascita,
  comune,
  comuneCod,
  stato,
}: {
  nascita: 'all_nascita' | 'acc_nascita'
  comune: CampoTesto
  comuneCod: CampoTesto
  stato: CampoTesto
}) {
  const { register, control, getValues } = useFormContext<MdiFormValues>()
  const tipo = useWatch({ control, name: nascita })
  const inItalia = () => getValues(nascita) === 'italia'

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-2 text-body-m text-on-surface-variant">
          Nato/a in *
        </p>
        <div className="grid grid-cols-2 gap-3">
          <ChoiceItem type="radio" value="italia" label={<strong>Italia</strong>} {...register(nascita)} />
          <ChoiceItem type="radio" value="estero" label={<strong>Estero</strong>} {...register(nascita)} />
        </div>
      </div>
      {tipo === 'italia' ? (
        <CampoComune nome={comune} cod={comuneCod} label="Comune di nascita" required attivo={inItalia} />
      ) : (
        <SelectPaese campo={stato} label="Stato di nascita" required escludiItalia attivo={() => !inItalia()} />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Scuola di provenienza (anagrafe MIUR scuole medie della Lombardia)
// ---------------------------------------------------------------------------

export function CampoScuolaProvenienza() {
  const { setValue, control } = useFormContext<MdiFormValues>()
  const { data: scuole, isLoading } = useScuoleMedie()
  const cod = useWatch({ control, name: 'all_scuola_provenienza_cod' })
  const { field } = useController<MdiFormValues, 'all_scuola_provenienza'>({ name: 'all_scuola_provenienza' })

  return (
    <Autocomplete<Scuola>
      label="Scuola di provenienza"
      placeholder="Nome della scuola o del comune…"
      value={field.value}
      caricamento={isLoading}
      suggerimenti={(t) => (scuole ? cercaScuole(scuole, t) : [])}
      chiave={(s) => s.codice}
      renderItem={(s) => (
        <>
          <span className="block font-bold">{s.nome}</span>
          <span className="block text-body-s text-on-surface-variant">
            {s.comune} · {s.codice}
          </span>
        </>
      )}
      onTesto={(t) => {
        field.onChange(t)
        setValue('all_scuola_provenienza_cod', '')
      }}
      onScegli={(s) => {
        setValue('all_scuola_provenienza_cod', s.codice)
        field.onChange(s.nome)
      }}
      onBlur={field.onBlur}
      vuoto="Nessuna scuola trovata: puoi lasciare il nome scritto così"
      hint={
        cod ? (
          <p className="mt-1 flex items-start gap-1 px-4 text-body-s text-success">
            <Icon name="check_circle" size={16} filled />Scuola dell’elenco ministeriale: {scuole?.find((s) => s.codice === cod)?.comune} · {cod}
          </p>
        ) : field.value.trim() ? (
          <p className="mt-1 flex items-start gap-1 px-4 text-body-s text-on-surface-variant">Se possibile scegli la scuola dall’elenco che compare mentre scrivi.</p>
        ) : null
      }
    />
  )
}
