import type { ReactNode } from 'react'

/** Etichetta di stato (non interattiva) sui container color M3. */
export type BadgeColor = 'success' | 'primary' | 'tertiary' | 'neutral' | 'error' | 'accent' | 'warning'

const COLOR_CLASSES: Record<BadgeColor, string> = {
  success: 'bg-success-container text-on-success-container',
  primary: 'bg-primary-container text-on-primary-container',
  tertiary: 'bg-tertiary-container text-on-tertiary-container',
  neutral: 'bg-surface-container-highest text-on-surface-variant',
  error: 'bg-error-container text-on-error-container',
  accent: 'bg-accent-container text-on-accent-container',
  warning: 'bg-warning-container text-on-warning-container',
}

export function Badge({ color, children }: { color: BadgeColor; children: ReactNode }) {
  return (
    <span
      className={`inline-flex h-6 items-center whitespace-nowrap rounded-sm px-2 text-label-m ${COLOR_CLASSES[color]}`}
    >
      {children}
    </span>
  )
}
