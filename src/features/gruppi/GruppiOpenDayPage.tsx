import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Checkbox } from '../../components/ui/Field'
import { ChipSet, FilterChip } from '../../components/ui/Chip'
import { Icon } from '../../components/ui/Icon'
import { List } from '../../components/ui/List'
import { Tabs } from '../../components/ui/Tabs'
import { EmptyState, PageHeader, SectionHeader } from '../../components/ui/PageHeader'
import { Spinner, ErrorBanner, InfoBanner } from '../../components/ui/Spinner'
import { CapacityGauge } from '../../components/charts/CapacityGauge'
import { useOpenDay } from '../../hooks/useOpenDays'
import { useBookings, useCheckIn } from '../../hooks/useBookings'
import { useCorsi } from '../../hooks/useCorsi'
import { useOpenDayCorsi, type IndirizzoOpenDay } from '../../hooks/useOpenDayCorsi'
import { useRealtimeOpenDay } from '../../hooks/useRealtimeInvalidate'
import { STATO_BOOKING_COLOR, STATO_BOOKING_LABEL } from '../../lib/constants'
import type { Booking, Corso } from '../../types/database.types'
import { PresenteLabel } from '../bookings/ElencoIscritti'
import { cambiIndirizzo, raggruppaPerIndirizzo, riepilogoIndirizzi, type Gruppo } from './gruppi'
import { SpostaIndirizzoSelect } from './IndirizzoControls'

function MembroGruppo({ booking, indirizzi, corsi }: { booking: Booking; indirizzi: IndirizzoOpenDay[]; corsi: Corso[] }) {
  const { checkIn, isPending } = useCheckIn()
  const cambiato = booking.corso_iniziale_id !== booking.corso_id
  return (
    <li className="flex flex-col gap-2 py-2">
      <div className="flex items-start justify-between gap-2">
        <label className="flex min-w-0 cursor-pointer items-start gap-1">
          <Checkbox
            className="-ml-2.5"
            checked={booking.checked_in}
            disabled={isPending}
            onChange={(e) => void checkIn(booking, e.target.checked)}
            aria-label={`Check-in ${booking.cognome} ${booking.nome}`}
          />
          <span className="min-w-0 pt-2">
            <span className={`block text-title-s ${booking.checked_in ? 'text-on-surface' : 'text-on-surface-variant'}`}>
              {booking.cognome} {booking.nome}
            </span>
            {booking.scuola && <span className="block truncate text-body-s text-on-surface-variant">{booking.scuola}</span>}
          </span>
        </label>
        <div className="flex shrink-0 flex-col items-end gap-1 pt-2">
          {booking.status !== 'confirmed' && (
            <Badge color={STATO_BOOKING_COLOR[booking.status]}>{STATO_BOOKING_LABEL[booking.status]}</Badge>
          )}
          {cambiato && <Badge color="warning">spostato</Badge>}
        </div>
      </div>
      <SpostaIndirizzoSelect booking={booking} indirizzi={indirizzi} corsi={corsi} className="w-full" />
    </li>
  )
}

function ColonnaGruppo({ gruppo, indirizzi, corsi }: { gruppo: Gruppo; indirizzi: IndirizzoOpenDay[]; corsi: Corso[] }) {
  const presenti = gruppo.membri.filter((b) => b.checked_in).length
  return (
    <Card className="flex flex-col gap-3 overflow-hidden !p-0">
      <div
        className={`flex items-start justify-between gap-2 px-4 pt-4 pb-3 ${
          gruppo.corsoId ? 'bg-accent-container text-on-accent-container' : 'bg-surface-container-high text-on-surface-variant'
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Icon name={gruppo.corsoId ? 'groups' : 'person_off'} />
          <div className="min-w-0">
            <h2 className="text-title-m">{gruppo.nome}</h2>
            <p className="text-body-s opacity-80">
              {gruppo.membri.length} nel gruppo · {presenti} presenti
            </p>
          </div>
        </div>
        {gruppo.fuoriConfigurazione && <Badge color="warning">fuori Open Day</Badge>}
      </div>
      <div className="flex flex-col gap-2 px-4 pb-3">
        {gruppo.posti_max && <CapacityGauge value={gruppo.membri.length} max={gruppo.posti_max} label="Posti indirizzo" />}
        {gruppo.membri.length === 0 && <p className="py-2 text-body-m text-on-surface-variant">Nessuno in questo gruppo.</p>}
        <List>
          {gruppo.membri.map((b) => (
            <MembroGruppo key={b.id} booking={b} indirizzi={indirizzi} corsi={corsi} />
          ))}
        </List>
      </div>
    </Card>
  )
}

function Board({ bookings, indirizzi, corsi }: { bookings: Booking[]; indirizzi: IndirizzoOpenDay[]; corsi: Corso[] }) {
  const [soloPresenti, setSoloPresenti] = useState(false)
  const gruppi = raggruppaPerIndirizzo(bookings, indirizzi, corsi, { soloPresenti })
  return (
    <div className="space-y-4">
      <ChipSet label="Chi mostrare">
        <FilterChip selected={!soloPresenti} onClick={() => setSoloPresenti(false)}>
          Tutti gli iscritti
        </FilterChip>
        <FilterChip selected={soloPresenti} onClick={() => setSoloPresenti(true)}>
          Solo presenti
        </FilterChip>
      </ChipSet>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {gruppi.map((g) => (
          <ColonnaGruppo key={g.corsoId ?? 'senza'} gruppo={g} indirizzi={indirizzi} corsi={corsi} />
        ))}
      </div>
    </div>
  )
}

const th = 'h-14 px-3 text-right align-middle text-title-s text-on-surface-variant'
const td = 'h-13 px-3 text-right align-middle tabular-nums'

function Riepilogo({ bookings, indirizzi, corsi }: { bookings: Booking[]; indirizzi: IndirizzoOpenDay[]; corsi: Corso[] }) {
  const righe = riepilogoIndirizzi(bookings, indirizzi, corsi)
  const cambi = cambiIndirizzo(bookings, corsi)
  const tot = righe.reduce(
    (t, r) => ({ iniziali: t.iniziali + r.iniziali, iscritti: t.iscritti + r.iscritti, presenti: t.presenti + r.presenti }),
    { iniziali: 0, iscritti: 0, presenti: 0 },
  )
  const perc = (p: number, n: number) => (n > 0 ? `${Math.round((p / n) * 100)}%` : '—')

  return (
    <div className="space-y-4">
      <Card>
        <SectionHeader
          title="Per indirizzo"
          actions={
            <Button variant="text" icon="print" className="print:hidden" onClick={() => window.print()}>
              Stampa
            </Button>
          }
        />
        <div className="-mx-4 overflow-x-auto sm:-mx-6">
          <table className="w-full min-w-[560px] text-body-m">
            <thead>
              <tr className="border-b border-outline-variant">
                <th className={`${th} !text-left pl-4 sm:pl-6`}>Indirizzo</th>
                <th className={th} title="Scelto all'iscrizione">
                  Iniziali
                </th>
                <th className={th}>Spostamenti</th>
                <th className={th}>Attuali</th>
                <th className={th}>Presenti</th>
                <th className={`${th} pr-4 sm:pr-6`}>Presenza</th>
              </tr>
            </thead>
            <tbody>
              {righe.map((r) => (
                <tr key={r.corsoId ?? 'senza'} className="border-b border-outline-variant">
                  <td className={`${td} !text-left pl-4 text-title-s text-on-surface sm:pl-6`}>
                    {r.nome}
                    {r.fuoriConfigurazione && <span className="ml-1 text-body-s text-on-warning-container">(fuori Open Day)</span>}
                    {r.posti_max && <span className="ml-1 text-body-s text-on-surface-variant">· {r.posti_max} posti</span>}
                  </td>
                  <td className={`${td} text-on-surface-variant`}>{r.iniziali}</td>
                  <td className={`${td} text-body-s`}>
                    {r.entrati > 0 && <span className="text-success">+{r.entrati}</span>}
                    {r.entrati > 0 && r.usciti > 0 && ' '}
                    {r.usciti > 0 && <span className="text-error">−{r.usciti}</span>}
                    {r.entrati === 0 && r.usciti === 0 && <span className="text-on-surface-variant">—</span>}
                  </td>
                  <td className={`${td} text-title-s text-on-surface`}>{r.iscritti}</td>
                  <td className={`${td} text-on-surface`}>{r.presenti}</td>
                  <td className={`${td} pr-4 text-on-surface-variant sm:pr-6`}>{perc(r.presenti, r.iscritti)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-surface-container text-title-s text-on-surface">
                <td className={`${td} !text-left pl-4 sm:pl-6`}>Totale</td>
                <td className={td}>{tot.iniziali}</td>
                <td className={`${td} text-body-s text-on-surface-variant`}>{cambi.length} cambi</td>
                <td className={td}>{tot.iscritti}</td>
                <td className={td}>{tot.presenti}</td>
                <td className={`${td} pr-4 sm:pr-6`}>{perc(tot.presenti, tot.iscritti)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <Card>
        <SectionHeader title={`Cambi di indirizzo (${cambi.length})`} />
        {cambi.length === 0 && (
          <EmptyState icon="swap_horiz">Nessuno ha cambiato indirizzo rispetto all'iscrizione.</EmptyState>
        )}
        <List>
          {cambi.map((c) => (
            <li key={c.booking.id} className="flex min-h-14 flex-wrap items-center justify-between gap-2 py-2">
              <span className="flex flex-wrap items-center gap-x-2 text-title-s text-on-surface">
                {c.booking.cognome} {c.booking.nome}
                {c.booking.checked_in && <PresenteLabel />}
              </span>
              <span className="flex items-center gap-1 text-body-m text-on-surface-variant">
                {c.da}
                <Icon name="arrow_forward" size={16} />
                <strong className="text-on-surface">{c.a}</strong>
              </span>
            </li>
          ))}
        </List>
      </Card>
    </div>
  )
}

export function GruppiOpenDayPage() {
  const { openDayId } = useParams<{ openDayId: string }>()
  const { data: openDay } = useOpenDay(openDayId)
  const { data: bookings, isLoading, error } = useBookings(openDayId)
  const { data: corsi } = useCorsi()
  const { indirizzi, configurati } = useOpenDayCorsi(openDayId)
  const [vista, setVista] = useState<'board' | 'riepilogo'>('board')
  useRealtimeOpenDay(openDayId)

  const pronto = bookings && corsi && indirizzi

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gruppi d'interesse"
        back={{ to: `/staff/open-days/${openDayId}/iscrizioni`, label: 'Torna alle iscrizioni' }}
        subtitle={
          openDay && (
            <>
              Open Day del{' '}
              {new Date(openDay.data).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })} ·{' '}
              {openDay.ora.slice(0, 5)}
            </>
          )
        }
        actions={
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button variant="outlined" icon="fact_check" to={`/staff/open-days/${openDayId}/iscrizioni`}>
              Iscrizioni
            </Button>
            <Button variant="tonal" icon="monitoring" to="/staff/dashboard">
              Monitoraggio
            </Button>
          </div>
        }
      />

      {!configurati && pronto && (
        <InfoBanner className="print:hidden">
          Nessun indirizzo configurato per questo Open Day: sono mostrati tutti i corsi attivi. Puoi sceglierli da{' '}
          <Link to="/staff/open-days" className="font-bold text-primary underline">
            Open Day → Modifica
          </Link>
          .
        </InfoBanner>
      )}

      <Tabs
        label="Vista gruppi"
        className="print:hidden"
        value={vista}
        onChange={setVista}
        tabs={[
          { value: 'board', label: 'Gruppi (live)', icon: 'view_kanban' },
          { value: 'riepilogo', label: 'Riepilogo', icon: 'table_chart' },
        ]}
      />

      {isLoading && <Spinner />}
      {error && <ErrorBanner message="Errore nel caricamento delle iscrizioni." />}

      {pronto &&
        (vista === 'board' ? (
          <Board bookings={bookings} indirizzi={indirizzi} corsi={corsi} />
        ) : (
          <Riepilogo bookings={bookings} indirizzi={indirizzi} corsi={corsi} />
        ))}
    </div>
  )
}
