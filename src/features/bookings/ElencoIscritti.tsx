import { useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { STATO_BOOKING_COLOR, STATO_BOOKING_LABEL } from '../../lib/constants'
import type { Booking, Corso, Notifica } from '../../types/database.types'
import { NotificheIscrizione } from './NotificheIscrizione'
import { IndirizzoBadge } from '../gruppi/IndirizzoControls'

const FILTRI = [
  { key: 'attivi', label: 'Iscritti', match: (b: Booking) => ['confirmed', 'walk_in', 'waitlist'].includes(b.status) },
  { key: 'rifiutati', label: 'Rifiutati', match: (b: Booking) => b.status === 'rejected' },
  { key: 'tutti', label: 'Tutti', match: (b: Booking) => b.status !== 'pending' },
] as const

/** Elenco iscritti di un Open Day (esclusi quelli ancora da approvare), con stato delle notifiche. */
export function ElencoIscritti({
  bookings,
  notifiche,
  corsi,
}: {
  bookings: Booking[]
  notifiche: Notifica[]
  corsi: Corso[]
}) {
  const [filtro, setFiltro] = useState<(typeof FILTRI)[number]['key']>('attivi')
  const f = FILTRI.find((x) => x.key === filtro)!
  const righe = bookings.filter(f.match)

  return (
    <Card>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-text2">Persone iscritte</h2>
        <div className="flex gap-1">
          {FILTRI.map((x) => (
            <button
              key={x.key}
              type="button"
              onClick={() => setFiltro(x.key)}
              className={`rounded-full border px-3 py-1 text-xs font-bold ${
                filtro === x.key ? 'border-orange bg-orange-light text-orange-dark' : 'border-border text-text2'
              }`}
            >
              {x.label} ({bookings.filter(x.match).length})
            </button>
          ))}
        </div>
      </div>

      {righe.length === 0 && <p className="py-3 text-sm text-text3">Nessuna persona in questo elenco.</p>}
      {righe.map((b) => (
        <div key={b.id} className="border-b border-border py-2.5 last:border-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-text">
                {b.cognome} {b.nome}
                {b.checked_in && <span className="ml-2 text-xs text-green">✓ presente</span>}
              </p>
              <p className="text-xs text-text3">
                {b.telefono}
                {b.email ? ` · ${b.email}` : ''}
                {b.scuola ? ` · ${b.scuola}` : ''}
              </p>
              <div className="mt-0.5">
                <IndirizzoBadge booking={b} corsi={corsi} />
              </div>
              {b.status === 'rejected' && b.motivo_rifiuto && (
                <p className="text-xs italic text-text3">Motivo: {b.motivo_rifiuto}</p>
              )}
            </div>
            <Badge color={STATO_BOOKING_COLOR[b.status]}>{STATO_BOOKING_LABEL[b.status]}</Badge>
          </div>
          <NotificheIscrizione booking={b} notifiche={notifiche.filter((n) => n.booking_id === b.id)} />
        </div>
      ))}
    </Card>
  )
}
