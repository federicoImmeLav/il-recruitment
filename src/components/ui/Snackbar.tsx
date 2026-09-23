import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

interface Messaggio {
  id: number
  testo: string
}

const SnackbarContext = createContext<(testo: string) => void>(() => {})

/** Snackbar M3: messaggio breve di conferma in basso, sparisce da solo dopo 4 secondi. */
export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<Messaggio | null>(null)
  const seq = useRef(0)

  const mostra = useCallback((testo: string) => {
    seq.current += 1
    setMsg({ id: seq.current, testo })
  }, [])

  useEffect(() => {
    if (!msg) return
    const t = setTimeout(() => setMsg(null), 4000)
    return () => clearTimeout(t)
  }, [msg])

  return (
    <SnackbarContext.Provider value={mostra}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 medium:bottom-6 print:hidden"
      >
        {msg && (
          <div
            key={msg.id}
            className="pointer-events-auto flex min-h-12 max-w-xl items-center gap-2 rounded-xs bg-inverse-surface py-2 pl-4 pr-2 text-body-m text-inverse-on-surface shadow-elev-3"
          >
            <span className="flex-1 py-1">{msg.testo}</span>
            <button
              type="button"
              onClick={() => setMsg(null)}
              className="state-layer h-9 rounded-full px-3 text-label-l text-inverse-primary"
            >
              OK
            </button>
          </div>
        )}
      </div>
    </SnackbarContext.Provider>
  )
}

export function useSnackbar() {
  return useContext(SnackbarContext)
}
