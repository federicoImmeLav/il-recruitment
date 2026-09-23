import { useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Checkbox, InputField, SelectField } from '../../components/ui/Field'
import { List } from '../../components/ui/List'
import { EmptyState, PageHeader, SectionHeader } from '../../components/ui/PageHeader'
import { Spinner, ErrorBanner } from '../../components/ui/Spinner'
import { useSnackbar } from '../../components/ui/Snackbar'
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
  const snackbar = useSnackbar()
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
    snackbar(`${nome} ${cognome} aggiunto come walk-in`)
    setCognome('')
    setNome('')
    setTelefono('')
    setCorsoId('')
  }

  return (
    <Card>
      <SectionHeader title="Aggiungi walk-in" />
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] lg:items-start">
        <InputField label="Cognome" required value={cognome} onChange={(e) => setCognome(e.target.value)} />
        <InputField label="Nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
        <InputField label="Cellulare" type="tel" required value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        <SelectField label="Indirizzo" value={corsoId} onChange={(e) => setCorsoId(e.target.value)}>
          <option value="">Nessuno</option>
          {indirizzi.map((i) => (
            <option key={i.corso.id} value={i.corso.id}>
              {i.corso.nome}
            </option>
          ))}
        </SelectField>
        <Button type="submit" icon="person_add" size="lg" variant="tonal" disabled={createBooking.isPending}>
          {createBooking.isPending ? 'Aggiunta…' : 'Aggiungi'}
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
    <li className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Check-in in prima posizione: è l'azione più frequente durante l'evento, a mano libera. */}
      <div className="min-w-0">
        <label className="flex cursor-pointer items-start gap-2">
          <Checkbox
            className="-ml-2.5"
            checked={booking.checked_in}
            disabled={checkinPending}
            onChange={(e) => void checkIn(booking, e.target.checked)}
            aria-label={`Check-in ${booking.cognome} ${booking.nome}`}
          />
          <span className="min-w-0 pt-1.5">
            <span className="block text-title-s text-on-surface">
              {booking.cognome} {booking.nome}
            </span>
            <span className="block text-body-m text-on-surface-variant">
              {booking.telefono}
              {booking.scuola ? ` · ${booking.scuola}` : ''}
            </span>
          </span>
        </label>
        <div className="pl-10">
          <div className="mt-1">
            <IndirizzoBadge booking={booking} corsi={corsi} />
          </div>
          <NotificheIscrizione booking={booking} notifiche={notifiche} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 pl-10 sm:pl-0">
        <Badge color={STATO_BOOKING_COLOR[booking.status]}>{STATO_BOOKING_LABEL[booking.status]}</Badge>
        {booking.status === 'waitlist' && (
          <Button
            variant="outlined"
            onClick={() =>
              void updateBooking.mutateAsync({ id: booking.id, open_day_id: booking.open_day_id, status: 'confirmed' as StatoBooking })
            }
          >
            Conferma
          </Button>
        )}
        {booking.status === 'rejected' && (
          <Button variant="outlined" disabled={decidi.isPending} onClick={() => void decidi.mutateAsync({ booking, approva: true })}>
            Approva comunque
          </Button>
        )}
        {booking.status !== 'rejected' && booking.status !== 'cancelled' && (
          <SpostaIndirizzoSelect booking={booking} indirizzi={indirizzi} corsi={corsi} />
        )}
      </div>
    </li>
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
      <PageHeader
        title="Gestione iscrizioni"
        back={{ to: '/staff/open-days', label: 'Torna agli Open Day' }}
        subtitle={
          openDay && (
            <>
              {new Date(openDay.data).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })} ·{' '}
              {checkedIn}/{totale} check-in effettuati
            </>
          )
        }
        actions={
          <>
            <Button variant="outlined" icon="groups" to={`/staff/open-days/${openDayId}/gruppi`}>
              Gruppi d'interesse
            </Button>
            <Button variant="tonal" icon="monitoring" to="/staff/dashboard">
              Monitoraggio
            </Button>
          </>
        }
      />

      {bookings && <RichiesteDaApprovare bookings={bookings} />}

      {openDayId && <WalkInForm openDayId={openDayId} indirizzi={indirizzi ?? []} />}

      <Card>
        <SectionHeader
          title="Iscritti"
          actions={
            <SelectField
              dense
              label="Indirizzo"
              className="min-w-52"
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
            </SelectField>
          }
        />
        {isLoading && <Spinner />}
        {error && <ErrorBanner message="Errore nel caricamento delle iscrizioni." />}
        {elenco?.length === 0 && <EmptyState icon="group_off">Nessuna iscrizione in questo elenco.</EmptyState>}
        <List>
          {elenco?.map((b) => (
            <BookingRow
              key={b.id}
              booking={b}
              notifiche={notifiche?.filter((n) => n.booking_id === b.id) ?? []}
              indirizzi={indirizzi ?? []}
              corsi={corsi ?? []}
            />
          ))}
        </List>
      </Card>
    </div>
  )
}
