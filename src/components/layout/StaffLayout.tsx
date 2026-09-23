import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthProvider'

const NAV_ITEMS = [
  { to: '/staff/dashboard', label: 'Monitoraggio' },
  { to: '/staff/open-days', label: 'Open Day' },
  { to: '/staff/mdi', label: 'MDI' },
]

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            `rounded-il px-3 py-2 text-sm font-bold transition-colors ${
              isActive ? 'bg-orange-light text-orange-dark' : 'text-text2 hover:bg-gray-light'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

export function StaffLayout() {
  const { profile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-xl md:flex">
      {/* Sidebar desktop */}
      <aside className="hidden w-[230px] shrink-0 border-r border-border bg-white p-4 md:block">
        <div className="mb-6 px-1">
          <p className="text-sm font-black text-text">Immaginazione e Lavoro</p>
          <p className="text-xs text-text3">Recruitment IeFP</p>
        </div>
        <NavLinks />
      </aside>

      <div className="flex-1">
        {/* Topbar */}
        <header className="flex h-14 items-center justify-between border-b-4 border-orange bg-white px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Apri menu"
              onClick={() => setMenuOpen(true)}
              className="rounded-il border border-border px-2 py-1 text-lg md:hidden"
            >
              &#9776;
            </button>
            <p className="text-sm font-bold text-text md:hidden">IL Recruitment</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-text2 sm:inline">{profile?.nome_completo}</span>
            <button type="button" onClick={() => void signOut()} className="font-bold text-blue hover:underline">
              Esci
            </button>
          </div>
        </header>

        {/* Sidebar mobile (overlay) */}
        {menuOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <div className="w-64 bg-white p-4 shadow-il">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-black text-text">IL Recruitment</p>
                <button type="button" aria-label="Chiudi menu" onClick={() => setMenuOpen(false)} className="text-xl">
                  &times;
                </button>
              </div>
              <NavLinks onNavigate={() => setMenuOpen(false)} />
            </div>
            <div className="flex-1 bg-black/40" onClick={() => setMenuOpen(false)} />
          </div>
        )}

        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
