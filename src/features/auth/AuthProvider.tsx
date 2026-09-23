import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabaseClient'
import type { Profile } from '../../types/database.types'

interface AuthState {
  session: Session | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadProfile(currentSession: Session | null) {
      if (!currentSession) {
        if (active) setProfile(null)
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentSession.user.id)
        .maybeSingle()
      if (active) setProfile(data as Profile | null)
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      loadProfile(data.session).finally(() => {
        if (active) setLoading(false)
      })
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      loadProfile(newSession)
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, signOut }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve essere usato dentro <AuthProvider>')
  return ctx
}
