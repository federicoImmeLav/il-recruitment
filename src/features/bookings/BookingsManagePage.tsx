import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { InputField, SelectField } from '../../components/ui/Field'
import { Spinner, ErrorBanner } from '../../components/ui/Spinner'
import { useOpenDay } from '../../hooks/useOpenDays'
import { useBookings, useCheckIn, useCreateBooking, useDecidiIscrizione, useUpdateBooking } from '../../hooks/useBookings'
import { useRealtimeOpenDay } from '../../hooks/useRealtimeInvalidate'
import { useNotifiche } from '../../hooks/useNotifiche'
import { useCorsi } from '../../hooks/useCorsi'
import { useOpenDayCorsi, type IndirizzoOpenDay } from '../../hooks/useOpenDayCorsi'
import { IndirizzoBadge, SpostaIndirizzoSelect } from '../gruppi/IndirizzoControls'
import { RichiesteDaApprovare } from './RichiesteDaApprovare'
import { NotificheIscrizione } from './NotificheIscrizione'
import { STATO_BOOKING_COLOR, STATO_BOOKING_LABEL } from '../../lib/constants'
import type { Booking, Corso, Notifica, StatoBooking } from '../../types/database.types'

function WalkInForm({ openDayId, indirizzi }: { openDayId: string; indirizzi: IndirizzoOpenDay[] }) {
  const createBooking = useCreateBooking()
  const [cognome, setCognome] = useState('')
  const [nome, setNome] = useState('')
  const [telefono, setTelefono] = useState('')
  const [corsoId, setCorsoId] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await createBooking.mutateAsync({
      open_day_id: openDayId,
      cognome,
      nome,
      telefono,
      corso_id: corsoId || null,
      canale: 'walk_in',
    })
    setCognome('')
    setNome('')
    setTelefono('')
    setCorsoId('')
  }

  return (
    <Card>
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-text3">Aggiungi walk-in</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-5 sm:items-end">
        <InputField label="Cognome" required value={cognome} onChange={(e) => setCognome(e.target.value)} />
        <InputField label="Nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
        <InputField label="Cellulare" required value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        <SelectField label="Indirizzo" value={corsoId} onChange={(e) => setCorsoId(e.target.value)}>
          <option value="">Nessuno</option>
          {indirizzi.map((i) => (
            <option key={i.corso.id} value={i.corso.id}>
              {i.corso.nome}
            </option>
          ))}
        </SelectField>
        <Button type="submit" disabled={createBooking.isPending}>
          {createBooking.isPending ? 'Aggiunta…' : '+ Aggiungi'}
        </Button>
      </form>
    </Card>
  )
}

function BookingRow({
  booking,
  notifiche,
  indirizzi,
  corsi,
}: {
  booking: Booking
  notifiche: Notifica[]
  indirizzi: IndirizzoOpenDay[]
  corsi: Corso[]
}) {
  const { checkIn, isPending: checkinPending } = useCheckIn()
  const updateBooking = useUpdateBooking()
  const decidi = useDecidiIscrizione()

  return (
    <div className="flex flex-col gap-2 border-b border-border py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-bold text-text">
          {booking.cognome} {booking.nome}
        </p>
        <p className="text-xs text-text3">
          {booking.telefono}
          {booking.scuola ? ` · ${booking.scuola}` : ''}
        </p>
        <div className="mt-1">
          <IndirizzoBadge booking={booking} corsi={corsi} />
        </div>
        <NotificheIscrizione booking={booking} notifiche={notifiche} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {booking.status !== 'rejected' && booking.status !== 'cancelled' && (
          <SpostaIndirizzoSelect booking={booking} indirizzi={indirizzi} corsi={corsi} />
        )}
        <Badge color={STATO_BOOKING_COLOR[booking.status]}>{STATO_BOOKING_LABEL[booking.status]}</Badge>
        {booking.status === 'waitlist' && (
          <Button
            variant="ghost"
            className="text-xs"
            onClick={() =>
              void updateBooking.mutateAsync({ id: booking.id, open_day_id: booking.open_day_id, status: 'confirmed' as StatoBooking })
            }
          >
            Conferma
          </Button>
        )}
        {booking.status === 'rejected' && (
          <Button
            variant="ghost"
            className="text-xs"
            disabled={decidi.isPending}
            onClick={() => void decidi.mutateAsync({ booking, approva: true })}
          >
            Approva comunque
          </Button>
        )}
        <label className="flex items-center gap-1 text-xs font-bold text-text2">
          <input
            type="checkbox"
            className="h-4 w-4 accent-green"
            checked={booking.checked_in}
            disabled={checkinPending}
            onChange={(e) => void checkIn(booking, e.target.checked)}
          />
          Check-in
        </label>
      </div>
    </div>
  )
}

export function BookingsManagePage() {
  const { openDayId } = useParams<{ openDayId: string }>()
  const { data: openDay } = useOpenDay(openDayId)
  const { data: bookings, isLoading, error } = useBookings(openDayId)
  const { data: notifiche } = useNotifiche(openDayId)
  const { data: corsi } = useCorsi()
  const { indirizzi } = useOpenDayCorsi(openDayId)
  // Filtro per indirizzo attuale: 'tutti', '' = senza indirizzo, altrimenti corso_id.
  const [filtroIndirizzo, setFiltroIndirizzo] = useState('tutti')
  useRealtimeOpenDay(openDayId)

  const checkedIn = bookings?.filter((b) => b.checked_in).length ?? 0
  const totale = bookings?.filter((b) => ['confirmed', 'walk_in', 'waitlist'].includes(b.status)).length ?? 0
  const elenco = bookings
    ?.filter((b) => b.status !== 'pending')
    .filter((b) => filtroIndirizzo === 'tutti' || (b.corso_id ?? '') === filtroIndirizzo)
  // Opzioni del filtro: indirizzi dell'Open Day + eventuali altri gia' assegnati a qualcuno.
  const opzioniFiltro = [
    ...(indirizzi ?? []).map((i) => i.corso),
    ...(corsi ?? []).filter(
      (c) => !indirizzi?.some((i) => i.corso.id === c.id) && bookings?.some((b) => b.corso_id === c.id),
    ),
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-text">Gestione iscrizioni</h1>
          {openDay && (
            <p className="text-sm text-text3">
              {new Date(openDay.data).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })} ·{' '}
              {checkedIn}/{totale} check-in effettuati
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/staff/open-days/${openDayId}/gruppi`}>
            <Button variant="ghost">Gruppi d'interesse</Button>
          </Link>
          <Link to="/staff/dashboard">
            <Button variant="blue">Vai al monitoraggio</Button>
          </Link>
        </div>
      </div>

      {bookings && <RichiesteDaApprovare bookings={bookings} />}

      {openDayId && <WalkInForm openDayId={openDayId} indirizzi={indirizzi ?? []} />}

      <Card>
        <div className="mb-2 flex items-center gap-2">
          <label htmlFor="filtro-indirizzo" className="text-xs font-bold uppercase tracking-wide text-text3">
            Indirizzo
          </label>
          <select
            id="filtro-indirizzo"
            className="rounded-il border border-border bg-white px-2 py-1.5 text-sm text-text focus:border-blue focus:outline-none"
            value={filtroIndirizzo}
            onChange={(e) => setFiltroIndirizzo(e.target.value)}
          >
            <option value="tutti">Tutti</option>
            {opzioniFiltro.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
            <option value="">Senza indirizzo</option>
          </select>
        </div>
        {isLoading && <Spinner />}
        {error && <ErrorBanner message="Errore nel caricamento delle iscrizioni." />}
        {elenco?.length === 0 && <p className="text-sm text-text3">Nessuna iscrizione in questo elenco.</p>}
        {elenco?.map((b) => (
          <BookingRow
            key={b.id}
            booking={b}
            notifiche={notifiche?.filter((n) => n.booking_id === b.id) ?? []}
            indirizzi={indirizzi ?? []}
            corsi={corsi ?? []}
          />
        ))}
      </Card>
    </div>
  )
}
