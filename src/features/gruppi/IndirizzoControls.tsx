import { Badge } from '../../components/ui/Badge'
import { SelectField } from '../../components/ui/Field'
import { useSpostaIndirizzo } from '../../hooks/useBookings'
import type { IndirizzoOpenDay } from '../../hooks/useOpenDayCorsi'
import type { Booking, Corso } from '../../types/database.types'

/** Indirizzo attuale dell'iscritto, con l'eventuale indirizzo scelto all'iscrizione se diverso. */
export function IndirizzoBadge({ booking, corsi }: { booking: Booking; corsi: Corso[] }) {
  const nome = (id: string | null) => (id ? (corsi.find((c) => c.id === id)?.nome ?? '—') : 'Nessuno')
  const cambiato = booking.corso_iniziale_id !== booking.corso_id
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <Badge color={booking.corso_id ? 'accent' : 'neutral'}>{booking.corso_id ? nome(booking.corso_id) : 'Senza indirizzo'}</Badge>
      {cambiato && <span className="text-body-s text-on-surface-variant">da {nome(booking.corso_iniziale_id)}</span>}
    </span>
  )
}

/**
 * Select compatta per spostare un iscritto in un altro indirizzo / gruppo.
 * Un tap su smartphone, niente drag & drop. Se l'indirizzo attuale non e' tra
 * quelli dell'Open Day resta comunque selezionabile per non perderlo.
 */
export function SpostaIndirizzoSelect({
  booking,
  indirizzi,
  corsi,
  className = '',
}: {
  booking: Booking
  indirizzi: IndirizzoOpenDay[]
  corsi: Corso[]
  className?: string
}) {
  const { sposta, isPending } = useSpostaIndirizzo()
  const attualeFuori = booking.corso_id && !indirizzi.some((i) => i.corso.id === booking.corso_id)
  const corsoAttuale = attualeFuori ? corsi.find((c) => c.id === booking.corso_id) : undefined

  return (
    <SelectField
      dense
      label="Indirizzo"
      aria-label={`Indirizzo di ${booking.cognome} ${booking.nome}`}
      className={`min-w-44 max-w-full ${className}`}
      value={booking.corso_id ?? ''}
      disabled={isPending}
      onChange={(e) => void sposta(booking, e.target.value || null)}
    >
      <option value="">Senza indirizzo</option>
      {indirizzi.map((i) => (
        <option key={i.corso.id} value={i.corso.id}>
          {i.corso.nome}
        </option>
      ))}
      {attualeFuori && <option value={booking.corso_id!}>{corsoAttuale?.nome ?? 'Indirizzo non più attivo'} (fuori Open Day)</option>}
    </SelectField>
  )
}
