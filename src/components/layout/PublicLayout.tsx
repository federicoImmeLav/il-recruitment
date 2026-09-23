import type { ReactNode } from 'react'

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-xl">
      <header className="border-b-4 border-orange bg-white px-4 py-3 sm:px-6">
        <p className="text-sm font-black text-text">Immaginazione e Lavoro</p>
        <p className="text-xs text-text3">Recruitment IeFP</p>
      </header>
      <main className="mx-auto max-w-xl px-4 py-6 sm:px-6 sm:py-10">{children}</main>
    </div>
  )
}
