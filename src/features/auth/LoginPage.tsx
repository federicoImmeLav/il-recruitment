import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { InputField } from '../../components/ui/Field'
import { ErrorBanner } from '../../components/ui/Spinner'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setSubmitting(false)
    if (signInError) {
      setError('Credenziali non valide. Riprova o contatta l’amministratore.')
      return
    }
    const redirectTo = (location.state as { from?: string } | null)?.from ?? '/staff/dashboard'
    navigate(redirectTo, { replace: true })
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface-container-low px-4 py-8">
      <Card className="w-full max-w-sm">
        <img src="/logo-il.jpg" alt="Immaginazione e Lavoro" className="mx-auto mb-4 h-20 w-auto mix-blend-multiply" />
        <h1 className="text-center text-headline-s text-on-surface">Area riservata staff</h1>
        <p className="mb-6 mt-1 text-center text-body-m text-on-surface-variant">Recruitment IeFP</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label="Email"
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <InputField
            label="Password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <ErrorBanner message={error} />}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Accesso in corso…' : 'Accedi'}
          </Button>
        </form>
        <p className="mt-6 text-body-s text-on-surface-variant">
          Non hai un account? Gli accessi staff vengono creati dall’amministratore: contattalo per essere invitato.
        </p>
      </Card>
    </div>
  )
}
