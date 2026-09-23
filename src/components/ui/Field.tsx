import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

function Label({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-text2">
      {children}
      {required && <span className="text-red"> *</span>}
    </label>
  )
}

const controlClass =
  'w-full rounded-il border border-border bg-white px-3 py-2 text-sm text-text focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20'

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  required?: boolean
  error?: string
  /** Contenuto extra sotto il campo (es. badge "precompilato" nel kiosk MDI). */
  hint?: ReactNode
}

export function InputField({ label, required, error, hint, className = '', ...props }: InputFieldProps) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <input className={`${controlClass} ${className}`} {...props} />
      {hint}
      {error && <p className="mt-1 text-xs text-red">{error}</p>}
    </div>
  )
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  required?: boolean
  error?: string
  hint?: ReactNode
  children: ReactNode
}

export function SelectField({ label, required, error, hint, className = '', children, ...props }: SelectFieldProps) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <select className={`${controlClass} ${className}`} {...props}>
        {children}
      </select>
      {hint}
      {error && <p className="mt-1 text-xs text-red">{error}</p>}
    </div>
  )
}

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  required?: boolean
  error?: string
}

export function TextareaField({ label, required, error, className = '', ...props }: TextareaFieldProps) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <textarea className={`${controlClass} ${className}`} {...props} />
      {error && <p className="mt-1 text-xs text-red">{error}</p>}
    </div>
  )
}

export function CheckboxField({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-2 text-sm text-text">
      <input type="checkbox" className="mt-0.5 h-4 w-4 accent-orange" {...props} />
      <span>{label}</span>
    </label>
  )
}
