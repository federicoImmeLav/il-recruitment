import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/PageHeader'
import { ErrorBanner, Spinner } from '../../components/ui/Spinner'
import { fetchSediAccessibili, useCitta, useSedi } from '../../hooks/useSedi'
import type { Citta, Sede } from '../../types/database.types'
import { useAuth } from '../auth/AuthProvider'

/*
 * Sede di lavoro dell'area staff. Le RLS limitano gia' i dati alle sedi
 * dell'utente: qui si sceglie solo quale guardare. `sedeId` undefined = "tutte
 * le mie sedi" (possibile solo per chi ne ha piu' d'una).
 */

interface SedeState {
  /** Sedi su cui l'utente ha accesso, in ordine. */
  sedi: Sede[]
  /** Tutte le sedi visibili (anche di altre città), per nomi e preferenze cross-sede. */
  tutteLeSedi: Sede[]
  citta: Citta[]
  sedeId: string | undefined
  sede: Sede | undefined
  setSedeId: (id: string | undefined) => void
  multiSede: boolean
  isAdmin: boolean
  nomeSede: (id: string | null | undefined) => string
}

const SedeContext = createContext<SedeState | undefined>(undefined)

const CHIAVE = 'il-recruitment.sede'

function leggiSalvata() {
  try {
    return localStorage.getItem(CHIAVE) ?? undefined
  } catch {
    return undefined
  }
}

function salva(id: string | undefined) {
  try {
    if (id) localStorage.setItem(CHIAVE, id)
    else localStorage.removeItem(CHIAVE)
  } catch {
    // Storage non disponibile (navigazione privata): si ricomincia da "tutte".
  }
}

export function SedeProvider({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth()
  const accessibili = useQuery({
    queryKey: ['sedi_accessibili', profile?.id],
    enabled: !!profile,
    queryFn: fetchSediAccessibili,
  })
  const tutte = useSedi()
  const citta = useCitta()
  const [scelta, setScelta] = useState<string | undefined>(leggiSalvata)

  const sedi = useMemo(() => {
    const ids = accessibili.data ?? []
    return ids.flatMap((id) => tutte.data?.find((s) => s.id === id) ?? [])
  }, [accessibili.data, tutte.data])

  const multiSede = sedi.length > 1
  // Con una sola sede la selezione e' implicita; una scelta salvata non piu' valida si ignora.
  const sedeId = multiSede ? (sedi.some((s) => s.id === scelta) ? scelta : undefined) : sedi[0]?.id

  const valore = useMemo<SedeState>(
    () => ({
      sedi,
      tutteLeSedi: tutte.data ?? [],
      citta: citta.data ?? [],
      sedeId,
      sede: sedi.find((s) => s.id === sedeId),
      setSedeId: (id) => {
        setScelta(id)
        salva(id)
      },
      multiSede,
      isAdmin: !!profile?.is_admin,
      nomeSede: (id) => tutte.data?.find((s) => s.id === id)?.nome ?? '—',
    }),
    [sedi, tutte.data, citta.data, sedeId, multiSede, profile?.is_admin],
  )

  if (accessibili.isPending || tutte.isPending || citta.isPending) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner label="Caricamento sedi…" />
      </div>
    )
  }

  if (accessibili.error || tutte.error || citta.error) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <ErrorBanner message="Errore nel caricamento delle sedi. Ricarica la pagina." />
      </div>
    )
  }

  if (sedi.length === 0 && !profile?.is_admin) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center p-6">
        <EmptyState icon="location_off">
          Il tuo account non è ancora abilitato su nessuna sede. Chiedi a un amministratore di assegnartene una.
        </EmptyState>
        <Button variant="outlined" icon="logout" onClick={() => void signOut()}>
          Esci
        </Button>
      </div>
    )
  }

  return <SedeContext.Provider value={valore}>{children}</SedeContext.Provider>
}

export function useSede() {
  const ctx = useContext(SedeContext)
  if (!ctx) throw new Error('useSede deve essere usato dentro <SedeProvider>')
  return ctx
}
