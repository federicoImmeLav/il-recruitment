import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'
import { Spinner } from '../components/ui/Spinner'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Verifica accesso…" />
      </div>
    )
  }

  if (!session || !profile || !profile.attivo) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}
