import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthProvider'
import { useSede } from '../../features/sedi/SedeProvider'
import { SedeSelector } from '../../features/sedi/SedeSelector'
import { azzeraDatiDemo } from '../../lib/demo/mockSupabase'
import { isDemoMode } from '../../lib/supabaseClient'
import { Icon } from '../ui/Icon'
import { Button, IconButton } from '../ui/Button'
import { Dialog } from '../ui/Dialog'

interface NavItem {
  to: string
  label: string
  icon: string
}

/**
 * Voci per ruolo: "Confronto" solo per chi vede più sedi, "Admin" solo per gli
 * amministratori e solo in rail/drawer (la navigation bar M3 regge al massimo
 * 5 voci; su smartphone l'admin ci arriva da Impostazioni).
 */
function useNavItems() {
  const { multiSede, isAdmin } = useSede()
  const principali: NavItem[] = [
    { to: '/staff/dashboard', label: 'Monitoraggio', icon: 'monitoring' },
    { to: '/staff/open-days', label: 'Open Day', icon: 'event' },
    { to: '/staff/mdi', label: 'MDI', icon: 'assignment' },
    ...(multiSede ? [{ to: '/staff/confronto', label: 'Confronto', icon: 'leaderboard' }] : []),
    { to: '/staff/impostazioni', label: 'Impostazioni', icon: 'settings' },
  ]
  const laterali = isAdmin ? [...principali, { to: '/staff/admin', label: 'Admin', icon: 'admin_panel_settings' }] : principali
  return { principali, laterali }
}

/*
 * Navigazione adattiva M3 per classe di finestra:
 * - compact (< 600dp): top app bar + navigation bar in basso;
 * - medium (600–1199dp): navigation rail a sinistra;
 * - expanded (≥ 1200dp): navigation drawer standard.
 */

/** Voce di rail/drawer: su medium icona con pillola + etichetta sotto, su expanded pillola larga. */
function SideNavLinks() {
  const { laterali } = useNavItems()
  return (
    <div className="flex flex-col gap-3 expanded:gap-0">
      {laterali.map((item) => (
        <NavLink key={item.to} to={item.to} className="group flex flex-col items-center gap-1 expanded:block">
          {({ isActive }) => (
            <>
              <span
                className={`state-layer flex h-8 w-14 items-center justify-center rounded-full expanded:h-14 expanded:w-full expanded:justify-start expanded:gap-3 expanded:px-4 ${
                  isActive ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant'
                }`}
              >
                <Icon name={item.icon} filled={isActive} />
                <span className="hidden text-label-l expanded:inline">{item.label}</span>
              </span>
              <span
                className={`text-label-m expanded:hidden ${isActive ? 'text-on-surface' : 'text-on-surface-variant'}`}
              >
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  )
}

function BottomNavBar() {
  const { principali } = useNavItems()
  return (
    <nav
      aria-label="Navigazione principale"
      className="fixed inset-x-0 bottom-0 z-30 flex h-20 bg-surface-container pb-[env(safe-area-inset-bottom)] medium:hidden print:hidden"
    >
      {principali.map((item) => (
        <NavLink key={item.to} to={item.to} className="flex flex-1 flex-col items-center justify-center gap-1">
          {({ isActive }) => (
            <>
              <span
                className={`state-layer flex h-8 w-16 items-center justify-center rounded-full ${
                  isActive ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant'
                }`}
              >
                <Icon name={item.icon} filled={isActive} />
              </span>
              <span className={`text-label-m ${isActive ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

/** Solo in demo: conferma prima di cancellare i dati salvati nel browser e ripartire da quelli di esempio. */
function AzzeraDemoDialog({ onClose }: { onClose: () => void }) {
  return (
    <Dialog
      title="Azzerare i dati demo?"
      onClose={onClose}
      footer={
        <>
          <Button variant="text" onClick={onClose}>
            Annulla
          </Button>
          <Button variant="danger" onClick={azzeraDatiDemo}>
            Azzera
          </Button>
        </>
      }
    >
      <p className="text-body-m text-on-surface-variant">
        Open Day, iscrizioni e MDI creati o modificati nella demo vengono cancellati in tutte le schede e si torna ai
        dati di esempio.
      </p>
    </Dialog>
  )
}

/** Menu account della top app bar (compact): nome utente, "Azzera dati demo" (solo demo) ed "Esci". */
function AccountMenu({ nome, onEsci, onAzzeraDemo }: { nome?: string; onEsci: () => void; onAzzeraDemo: () => void }) {
  const [aperto, setAperto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aperto) return
    const chiudi = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setAperto(false)
    }
    document.addEventListener('mousedown', chiudi)
    document.addEventListener('keydown', chiudi)
    return () => {
      document.removeEventListener('mousedown', chiudi)
      document.removeEventListener('keydown', chiudi)
    }
  }, [aperto])

  return (
    <div ref={ref} className="relative">
      <IconButton icon="account_circle" label="Account" aria-expanded={aperto} onClick={() => setAperto((a) => !a)} />
      {aperto && (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-1 min-w-56 rounded-xs bg-surface-container py-2 shadow-elev-2"
        >
          {nome && <p className="px-3 py-2 text-body-m text-on-surface-variant">{nome}</p>}
          {isDemoMode && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setAperto(false)
                onAzzeraDemo()
              }}
              className="state-layer flex h-12 w-full items-center gap-3 px-3 text-label-l text-on-surface"
            >
              <Icon name="restart_alt" className="text-on-surface-variant" />
              Azzera dati demo
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={onEsci}
            className="state-layer flex h-12 w-full items-center gap-3 px-3 text-label-l text-on-surface"
          >
            <Icon name="logout" className="text-on-surface-variant" />
            Esci
          </button>
        </div>
      )}
    </div>
  )
}

export function StaffLayout() {
  const { profile, signOut } = useAuth()
  const esci = () => void signOut()
  const [azzeraDemo, setAzzeraDemo] = useState(false)

  return (
    <div className="min-h-dvh bg-surface medium:flex">
      {/* Rail (medium) / drawer (expanded) */}
      <nav
        aria-label="Navigazione principale"
        className="sticky top-0 hidden h-dvh w-20 shrink-0 flex-col items-center bg-surface py-4 medium:flex expanded:w-[280px] expanded:items-stretch expanded:bg-surface-container-low expanded:px-3 print:hidden"
      >
        <div className="mb-6 flex flex-col items-center expanded:flex-row expanded:gap-3 expanded:px-4">
          <img src="/logo-il.jpg" alt="Immaginazione e Lavoro" className="h-12 w-auto mix-blend-multiply" />
          <div className="hidden expanded:block">
            <p className="text-title-s text-on-surface">Recruitment IeFP</p>
            <p className="text-body-s text-on-surface-variant">Open Day e MDI</p>
          </div>
        </div>
        <SideNavLinks />
        <div className="mt-auto flex flex-col items-center gap-1 expanded:flex-row expanded:gap-3 expanded:px-4">
          <p className="hidden min-w-0 flex-1 truncate text-body-m text-on-surface-variant expanded:block">
            {profile?.nome_completo}
          </p>
          {isDemoMode && <IconButton icon="restart_alt" label="Azzera dati demo" onClick={() => setAzzeraDemo(true)} />}
          <IconButton icon="logout" label="Esci" onClick={esci} />
        </div>
      </nav>

      <div className="min-w-0 flex-1">
        {/* Top app bar (compact) */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-2 bg-surface px-4 medium:hidden print:hidden">
          <img src="/logo-il.jpg" alt="" className="h-10 w-auto mix-blend-multiply" />
          <p className="min-w-0 flex-1 truncate text-title-l text-on-surface">Recruitment</p>
          <AccountMenu nome={profile?.nome_completo} onEsci={esci} onAzzeraDemo={() => setAzzeraDemo(true)} />
        </header>

        <main className="mx-auto max-w-[1440px] px-4 pb-28 pt-2 medium:px-6 medium:py-6 medium:pb-8">
          <SedeSelector />
          <Outlet />
        </main>
      </div>

      <BottomNavBar />
      {azzeraDemo && <AzzeraDemoDialog onClose={() => setAzzeraDemo(false)} />}
    </div>
  )
}
