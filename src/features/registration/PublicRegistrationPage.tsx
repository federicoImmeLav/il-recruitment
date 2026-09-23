import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PublicLayout } from '../../components/layout/PublicLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { CheckboxField, InputField, SelectField } from '../../components/ui/Field'
import { Spinner, ErrorBanner } from '../../components/ui/Spinner'
import { Icon } from '../../components/ui/Icon'
import { Badge } from '../../components/ui/Badge'
import { useOpenDayPublic, usePostiDisponibili } from '../../hooks/useOpenDays'
import { useOpenDayCorsi } from '../../hooks/useOpenDayCorsi'
import { useCreateBooking } from '../../hooks/useBookings'

export function PublicRegistrationPage() {
  const { openDayId } = useParams<{ openDayId: string }>()
  const navigate = useNavigate()
  const { data: openDay, isLoading, error } = useOpenDayPublic(openDayId)
  const { data: postiDisponibili } = usePostiDisponibili(openDayId)
  // Solo gli indirizzi presentati in questo Open Day (tutti i corsi attivi se non configurati).
  const corsi = useOpenDayCorsi(openDayId).indirizzi?.map((i) => i.corso)
  const createBooking = useCreateBooking()

  const [cognome, setCognome] = useState('')
  const [nome, setNome] = useState('')
  const [dataNascita, setDataNascita] = useState('')
  const [scuola, setScuola] = useState('')
  const [classe, setClasse] = useState('')
  const [residenza, setResidenza] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [corsoId, setCorsoId] = useState('')
  const [corso2Id, setCorso2Id] = useState('')
  const [flagSecondaMedia, setFlagSecondaMedia] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    try {
      const booking = await createBooking.mutateAsync({
        open_day_id: openDayId!,
        cognome,
        nome,
        telefono,
        data_nascita: dataNascita || null,
        scuola: scuola || null,
        classe: classe || null,
        residenza: residenza || null,
        email: email || null,
        corso_id: corsoId || null,
        corso2_id: corso2Id || null,
        canale: 'online',
        flag_seconda_media: flagSecondaMedia,
      })
      navigate(`/open-day/${openDayId}/grazie`, { state: { status: booking.status } })
    } catch {
      setSubmitError('Non è stato possibile completare la registrazione. Riprova tra qualche minuto.')
    }
  }

  if (isLoading) {
    return (
      <PublicLayout>
        <Spinner label="Caricamento evento…" />
      </PublicLayout>
    )
  }

  if (error || !openDay || openDay.stato !== 'aperto') {
    return (
      <PublicLayout>
        <ErrorBanner message="Questo Open Day non è (più) disponibile per le iscrizioni." />
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      <Card>
        <h1 className="text-headline-s text-on-surface">Iscrizione Open Day</h1>
        <p className="mt-1 flex items-center gap-2 text-body-l text-on-surface-variant">
          <Icon name="event" size={20} />
          {new Date(openDay.data).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })} alle{' '}
          {openDay.ora.slice(0, 5)}
        </p>
        {typeof postiDisponibili === 'number' && (
          <p className="mt-2">
            <Badge color={postiDisponibili > 0 ? 'success' : 'warning'}>
            {postiDisponibili > 0 ? `${postiDisponibili} posti disponibili` : 'Posti esauriti: sarai messo in lista d’attesa'}
            </Badge>
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InputField label="Cognome" required value={cognome} onChange={(e) => setCognome(e.target.value)} />
            <InputField label="Nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InputField
              label="Data di nascita"
              type="date"
              value={dataNascita}
              onChange={(e) => setDataNascita(e.target.value)}
            />
            <InputField label="Classe" value={classe} onChange={(e) => setClasse(e.target.value)} placeholder="es. 3ª media" />
          </div>
          <InputField label="Scuola di provenienza" value={scuola} onChange={(e) => setScuola(e.target.value)} />
          <InputField label="Residenza (città)" value={residenza} onChange={(e) => setResidenza(e.target.value)} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InputField
              label="Cellulare"
              type="tel"
              required
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
            <InputField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField label="Corso di interesse" value={corsoId} onChange={(e) => setCorsoId(e.target.value)}>
              <option value="">Seleziona…</option>
              {corsi?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </SelectField>
            <SelectField label="Seconda preferenza" value={corso2Id} onChange={(e) => setCorso2Id(e.target.value)}>
              <option value="">Nessuna</option>
              {corsi?.filter((c) => c.id !== corsoId).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </SelectField>
          </div>
          <CheckboxField
            label="Sono iscritto/a in seconda media"
            checked={flagSecondaMedia}
            onChange={(e) => setFlagSecondaMedia(e.target.checked)}
          />

          {submitError && <ErrorBanner message={submitError} />}

          <Button type="submit" size="lg" disabled={createBooking.isPending} className="w-full">
            {createBooking.isPending ? 'Invio in corso…' : 'Conferma iscrizione'}
          </Button>
        </form>
      </Card>
    </PublicLayout>
  )
}
