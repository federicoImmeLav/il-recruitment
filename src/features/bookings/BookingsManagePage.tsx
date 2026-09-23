import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { InputField } from '../../components/ui/Field'
import { Spinner, ErrorBanner } from '../../components/ui/Spinner'
import { useOpenDay } from '../../hooks/useOpenDays'
import { useBookings, useCheckIn, useCreateBooking, useDecidiIscrizione, useUpdateBooking } from '../../hooks/useBookings'
import { useRealtimeOpenDay } from '../../hooks/useRealtimeInvalidate'
import { useNotifiche } from '../../hooks/useNotifiche'
import { RichiesteDaApprovare } from './RichiesteDaApprovare'
import { NotificheIscrizione } from './NotificheIscrizione'
import { STATO_BOOKING_COLOR, STATO_BOOKING_LABEL } from '../../lib/constants'
import type { Booking, Notifica, StatoBooking } from '../../types/database.types'

function WalkInForm({ openDayId }: { openDayId: string }) {
  const createBooking = useCreateBooking()
  const [cognome, setCognome] = useState('')
  const [nome, setNome] = useState('')
  const [telefono, setTelefono] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await createBooking.mutateAsync({ open_day_id: openDayId, cognome, nome, telefono, canale: 'walk_in' })
    setCognome('')
    setNome('')
    setTelefono('')
  }

  return (
    <Card>
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-text3">Aggiungi walk-in</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end">
        <InputField label="Cognome" required value={cognome} onChange={(e) => setCognome(e.target.value)} />
        <InputField label="Nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
        <InputField label="Cellulare" required value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        <Button type="submit" disabled={createBooking.isPending}>
          {createBooking.isPending ? 'Aggiunta…' : '+ Aggiungi'}
        </Button>
      </form>
    </Card>
  )
}

function BookingRow({ booking, notifiche }: { booking: Booking; notifiche: Notifica[] }) {
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
        <NotificheIscrizione booking={booking} notifiche={notifiche} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
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
  useRealtimeOpenDay(openDayId)

  const checkedIn = bookings?.filter((b) => b.checked_in).length ?? 0
  const totale = bookings?.filter((b) => ['confirmed', 'walk_in', 'waitlist'].includes(b.status)).length ?? 0
  const elenco = bookings?.filter((b) => b.status !== 'pending')

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
        <Link to="/staff/dashboard">
          <Button variant="blue">Vai al monitoraggio</Button>
        </Link>
      </div>

      {bookings && <RichiesteDaApprovare bookings={bookings} />}

      {openDayId && <WalkInForm openDayId={openDayId} />}

      <Card>
        {isLoading && <Spinner />}
        {error && <ErrorBanner message="Errore nel caricamento delle iscrizioni." />}
        {elenco?.length === 0 && <p className="text-sm text-text3">Nessuna iscrizione ancora.</p>}
        {elenco?.map((b) => (
          <BookingRow key={b.id} booking={b} notifiche={notifiche?.filter((n) => n.booking_id === b.id) ?? []} />
        ))}
      </Card>
    </div>
  )
}
