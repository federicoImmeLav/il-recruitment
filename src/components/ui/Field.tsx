import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { Icon } from './Icon'
import { fieldAria, fieldInputClass } from './fieldUtils'

/*
 * Text field M3 "outlined": label flottante che interrompe il bordo (notch fatto con
 * fieldset/legend, così funziona su qualunque sfondo), supporting text ed errore sotto.
 * Il label flotta quando il campo ha il focus o un valore (`:placeholder-shown`), oppure
 * sempre se `alwaysFloat` (select, date, placeholder esplicito).
 */

export interface FieldShellProps {
  id: string
  label: string
  required?: boolean
  error?: string
  hint?: ReactNode
  supporting?: ReactNode
  alwaysFloat: boolean
  dense?: boolean
  className?: string
  trailing?: ReactNode
  children: ReactNode
}

function testoLabel(label: string, required?: boolean) {
  return required ? `${label} *` : label
}

export function FieldShell({
  id,
  label,
  required,
  error,
  hint,
  supporting,
  alwaysFloat,
  dense,
  className = '',
  trailing,
  children,
}: FieldShellProps) {
  const riposo = dense ? 'top-5 text-body-m' : 'top-7 text-body-l'
  const flottato = 'top-0 text-body-s'
  const labelPos = alwaysFloat
    ? flottato
    : `${riposo} peer-focus:top-0 peer-focus:text-body-s peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-body-s`
  const legendAperta = alwaysFloat
    ? '[&>legend]:max-w-full'
    : 'peer-focus:[&>legend]:max-w-full peer-[:not(:placeholder-shown)]:[&>legend]:max-w-full'
  const bordo = error
    ? 'border-error peer-focus:border-error'
    : 'border-outline peer-hover:border-on-surface peer-focus:border-primary'
  const coloreLabel = error ? 'text-error' : 'text-on-surface-variant peer-focus:text-primary'

  return (
    <div className={className}>
      <div className="relative">
        {children}
        <fieldset
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 -top-2 bottom-0 m-0 min-w-0 rounded-xs border px-3 text-left transition-colors peer-focus:border-2 peer-disabled:border-on-surface/12 ${bordo} ${legendAperta}`}
        >
          <legend className="invisible float-none block h-4 max-w-0 overflow-hidden whitespace-nowrap p-0 text-body-s transition-[max-width] duration-150">
            <span className="px-1">{testoLabel(label, required)}</span>
          </legend>
        </fieldset>
        <label
          htmlFor={id}
          className={`pointer-events-none absolute left-4 max-w-[calc(100%-2rem)] -translate-y-1/2 truncate transition-all duration-150 ease-standard peer-disabled:text-on-surface/38 ${labelPos} ${coloreLabel}`}
        >
          {testoLabel(label, required)}
        </label>
        {trailing}
      </div>
      {error ? (
        <p id={`${id}-err`} className="px-4 pt-1 text-body-s text-error">
          {error}
        </p>
      ) : (
        supporting && (
          <p id={`${id}-sup`} className="px-4 pt-1 text-body-s text-on-surface-variant">
            {supporting}
          </p>
        )
      )}
      {hint}
    </div>
  )
}

const ALWAYS_FLOAT_TYPES = new Set(['date', 'time', 'datetime-local', 'month', 'week', 'file', 'color'])

const ErrorIcon = () => (
  <Icon name="error" filled className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-error" />
)

interface CampoProps {
  label: string
  required?: boolean
  error?: string
  /** Contenuto extra sotto il campo (es. badge "precompilato" nel kiosk MDI). */
  hint?: ReactNode
  /** Supporting text M3 (sostituito dall'errore quando presente). */
  supporting?: ReactNode
  /** Densità compatta (40dp) per campi dentro righe di lista/tabella. */
  dense?: boolean
  /** Classi del contenitore (larghezza, griglia…). */
  className?: string
}

type InputFieldProps = CampoProps & Omit<InputHTMLAttributes<HTMLInputElement>, 'className'>

export function InputField({
  label,
  required,
  error,
  hint,
  supporting,
  dense,
  className,
  id: idProp,
  placeholder,
  type,
  ...props
}: InputFieldProps) {
  const auto = useId()
  const id = idProp ?? auto
  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      error={error}
      hint={hint}
      supporting={supporting}
      dense={dense}
      className={className}
      alwaysFloat={!!placeholder || ALWAYS_FLOAT_TYPES.has(type ?? '')}
      trailing={error ? <ErrorIcon /> : undefined}
    >
      <input
        id={id}
        type={type}
        placeholder={placeholder ?? ' '}
        className={fieldInputClass(dense, !!error)}
        {...fieldAria(id, error, supporting)}
        {...props}
      />
    </FieldShell>
  )
}

type SelectFieldProps = CampoProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> & { children: ReactNode }

export function SelectField({
  label,
  required,
  error,
  hint,
  supporting,
  dense,
  className,
  id: idProp,
  children,
  ...props
}: SelectFieldProps) {
  const auto = useId()
  const id = idProp ?? auto
  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      error={error}
      hint={hint}
      supporting={supporting}
      dense={dense}
      className={className}
      alwaysFloat
      trailing={
        <Icon
          name="arrow_drop_down"
          className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${error ? 'text-error' : 'text-on-surface-variant'}`}
        />
      }
    >
      <select
        id={id}
        className={`${fieldInputClass(dense, true)} cursor-pointer appearance-none`}
        {...fieldAria(id, error, supporting)}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  )
}

type TextareaFieldProps = CampoProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'>

export function TextareaField({
  label,
  required,
  error,
  hint,
  supporting,
  className,
  id: idProp,
  placeholder,
  ...props
}: TextareaFieldProps) {
  const auto = useId()
  const id = idProp ?? auto
  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      error={error}
      hint={hint}
      supporting={supporting}
      className={className}
      alwaysFloat={!!placeholder}
    >
      <textarea
        id={id}
        placeholder={placeholder ?? ' '}
        className="peer block min-h-28 w-full resize-y rounded-xs bg-transparent px-4 py-4 text-body-l text-on-surface outline-none placeholder:text-on-surface-variant/70"
        {...fieldAria(id, error, supporting)}
        {...props}
      />
    </FieldShell>
  )
}

/** Checkbox M3: quadrato 18dp dentro un'area 40dp con state layer (48dp di tocco). */
export function Checkbox({ className = '', ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  return (
    <span
      className={`state-layer flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-on-surface has-[:checked]:text-primary ${className}`}
    >
      <input type="checkbox" className="h-[18px] w-[18px] cursor-pointer accent-primary disabled:cursor-not-allowed" {...props} />
    </span>
  )
}

/** Radio button M3, stessa geometria del checkbox. */
export function Radio({ className = '', ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  return (
    <span
      className={`state-layer flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-on-surface has-[:checked]:text-primary ${className}`}
    >
      <input type="radio" className="h-5 w-5 cursor-pointer accent-primary disabled:cursor-not-allowed" {...props} />
    </span>
  )
}

export function CheckboxField({
  label,
  className = '',
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: ReactNode }) {
  return (
    <label className={`-ml-2.5 flex cursor-pointer items-start gap-1 text-body-m text-on-surface ${className}`}>
      <Checkbox {...props} />
      <span className="pt-2.5">{label}</span>
    </label>
  )
}

export function RadioField({
  label,
  className = '',
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: ReactNode }) {
  return (
    <label className={`-ml-2.5 flex cursor-pointer items-start gap-1 text-body-m text-on-surface ${className}`}>
      <Radio {...props} />
      <span className="pt-2.5">{label}</span>
    </label>
  )
}
