import type { ReactNode } from 'react'

/** Classi del controllo nativo dei text field outlined (vedi FieldShell in Field.tsx). */
export function fieldInputClass(dense?: boolean, conTrailing?: boolean) {
  return [
    'peer block w-full rounded-xs bg-transparent text-on-surface outline-none',
    'placeholder:text-on-surface-variant/70 disabled:text-on-surface/38',
    dense ? 'h-10 px-4 text-body-m' : 'h-14 px-4 text-body-l',
    conTrailing ? 'pr-12' : '',
  ].join(' ')
}

export function fieldAria(id: string, error?: string, supporting?: ReactNode) {
  return {
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-err` : supporting ? `${id}-sup` : undefined,
  }
}
