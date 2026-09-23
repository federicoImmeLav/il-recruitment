import type { ReactNode } from 'react'

/** Layout delle pagine pubbliche: top app bar con logo e contenuto a colonna singola. */
export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface-container-low">
      <header className="flex h-16 items-center gap-3 bg-surface px-4 sm:px-6">
        <img src="/logo-il.jpg" alt="Immaginazione e Lavoro" className="h-11 w-auto mix-blend-multiply" />
        <div>
          <p className="text-title-m text-on-surface">Immaginazione e Lavoro</p>
          <p className="text-body-s text-on-surface-variant">Recruitment IeFP</p>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-4 py-6 sm:px-6 sm:py-10">{children}</main>
    </div>
  )
}
