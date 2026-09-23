import { useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { ChipSet, FilterChip } from '../../components/ui/Chip'
import { Icon } from '../../components/ui/Icon'
import { List } from '../../components/ui/List'
import { EmptyState, SectionHeader } from '../../components/ui/PageHeader'
import { STATO_BOOKING_COLOR, STATO_BOOKING_LABEL } from '../../lib/constants'
import type { Booking, Corso, Notifica } from '../../types/database.types'
import { NotificheIscrizione } from './NotificheIscrizione'
import { IndirizzoBadge } from '../gruppi/IndirizzoControls'

const FILTRI = [
  { key: 'attivi', label: 'Iscritti', match: (b: Booking) => ['confirmed', 'walk_in', 'waitlist'].includes(b.status) },
  { key: 'rifiutati', label: 'Rifiutati', match: (b: Booking) => b.status === 'rejected' },
  { key: 'tutti', label: 'Tutti', match: (b: Booking) => b.status !== 'pending' },
] as const

/** Indicatore "presente" (check-in fatto), condiviso con la board dei gruppi. */
export function PresenteLabel() {
  return (
    <span className="inline-flex items-center gap-1 text-label-m text-success">
      <Icon name="check_circle" size={16} filled />
      presente
    </span>
  )
}

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
      <SectionHeader title="Persone iscritte" className="!mb-0" />
      <ChipSet label="Filtra iscritti" className="mb-2">
        {FILTRI.map((x) => (
          <FilterChip key={x.key} selected={filtro === x.key} onClick={() => setFiltro(x.key)}>
            {x.label} ({bookings.filter(x.match).length})
          </FilterChip>
        ))}
      </ChipSet>

      {righe.length === 0 && <EmptyState icon="group_off">Nessuna persona in questo elenco.</EmptyState>}
      <List>
        {righe.map((b) => (
          <li key={b.id} className="py-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-x-2 text-title-s text-on-surface">
                  {b.cognome} {b.nome}
                  {b.checked_in && <PresenteLabel />}
                </p>
                <p className="text-body-m text-on-surface-variant">
                  {b.telefono}
                  {b.email ? ` · ${b.email}` : ''}
                  {b.scuola ? ` · ${b.scuola}` : ''}
                </p>
                <div className="mt-1">
                  <IndirizzoBadge booking={b} corsi={corsi} />
                </div>
                {b.status === 'rejected' && b.motivo_rifiuto && (
                  <p className="mt-1 text-body-s italic text-on-surface-variant">Motivo: {b.motivo_rifiuto}</p>
                )}
              </div>
              <Badge color={STATO_BOOKING_COLOR[b.status]}>{STATO_BOOKING_LABEL[b.status]}</Badge>
            </div>
            <NotificheIscrizione booking={b} notifiche={notifiche.filter((n) => n.booking_id === b.id)} />
          </li>
        ))}
      </List>
    </Card>
  )
}
