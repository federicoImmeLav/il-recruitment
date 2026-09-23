import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Spinner, ErrorBanner } from '../../components/ui/Spinner'
import { CapacityGauge } from '../../components/charts/CapacityGauge'
import { useOpenDay } from '../../hooks/useOpenDays'
import { useBookings, useCheckIn } from '../../hooks/useBookings'
import { useCorsi } from '../../hooks/useCorsi'
import { useOpenDayCorsi, type IndirizzoOpenDay } from '../../hooks/useOpenDayCorsi'
import { useRealtimeOpenDay } from '../../hooks/useRealtimeInvalidate'
import { STATO_BOOKING_COLOR, STATO_BOOKING_LABEL } from '../../lib/constants'
import type { Booking, Corso } from '../../types/database.types'
import { cambiIndirizzo, raggruppaPerIndirizzo, riepilogoIndirizzi, type Gruppo } from './gruppi'
import { SpostaIndirizzoSelect } from './IndirizzoControls'

const pill = (attivo: boolean) =>
  `rounded-full border px-3 py-1 text-xs font-bold ${
    attivo ? 'border-orange bg-orange-light text-orange-dark' : 'border-border text-text2'
  }`

function MembroGruppo({ booking, indirizzi, corsi }: { booking: Booking; indirizzi: IndirizzoOpenDay[]; corsi: Corso[] }) {
  const { checkIn, isPending } = useCheckIn()
  const cambiato = booking.corso_iniziale_id !== booking.corso_id
  return (
    <div className="flex flex-col gap-1.5 border-b border-border py-2 last:border-0">
      <div className="flex items-start justify-between gap-2">
        <label className="flex min-w-0 items-start gap-2">
          <input
            type="checkbox"
            className="mt-0.5 h-5 w-5 shrink-0 accent-green"
            checked={booking.checked_in}
            disabled={isPending}
            onChange={(e) => void checkIn(booking, e.target.checked)}
            aria-label={`Check-in ${booking.cognome} ${booking.nome}`}
          />
          <span className="min-w-0">
            <span className={`block text-sm font-bold ${booking.checked_in ? 'text-text' : 'text-text3'}`}>
              {booking.cognome} {booking.nome}
            </span>
            {booking.scuola && <span className="block truncate text-xs text-text3">{booking.scuola}</span>}
          </span>
        </label>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {booking.status !== 'confirmed' && (
            <Badge color={STATO_BOOKING_COLOR[booking.status]}>{STATO_BOOKING_LABEL[booking.status]}</Badge>
          )}
          {cambiato && <Badge color="orange">spostato</Badge>}
        </div>
      </div>
      <SpostaIndirizzoSelect booking={booking} indirizzi={indirizzi} corsi={corsi} className="w-full" />
    </div>
  )
}

function ColonnaGruppo({ gruppo, indirizzi, corsi }: { gruppo: Gruppo; indirizzi: IndirizzoOpenDay[]; corsi: Corso[] }) {
  const presenti = gruppo.membri.filter((b) => b.checked_in).length
  return (
    <Card className={`flex flex-col gap-2 border-t-4 ${gruppo.corsoId ? 'border-t-purple' : 'border-t-gray'}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-bold text-text">{gruppo.nome}</h2>
          <p className="text-xs text-text3">
            {gruppo.membri.length} nel gruppo · {presenti} presenti
          </p>
        </div>
        {gruppo.fuoriConfigurazione && <Badge color="orange">fuori Open Day</Badge>}
      </div>
      {gruppo.posti_max && <CapacityGauge value={gruppo.membri.length} max={gruppo.posti_max} label="Posti indirizzo" />}
      {gruppo.membri.length === 0 && <p className="py-2 text-xs text-text3">Nessuno in questo gruppo.</p>}
      <div>
        {gruppo.membri.map((b) => (
          <MembroGruppo key={b.id} booking={b} indirizzi={indirizzi} corsi={corsi} />
        ))}
      </div>
    </Card>
  )
}

function Board({ bookings, indirizzi, corsi }: { bookings: Booking[]; indirizzi: IndirizzoOpenDay[]; corsi: Corso[] }) {
  const [soloPresenti, setSoloPresenti] = useState(false)
  const gruppi = raggruppaPerIndirizzo(bookings, indirizzi, corsi, { soloPresenti })
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1">
        <button type="button" className={pill(!soloPresenti)} onClick={() => setSoloPresenti(false)}>
          Tutti gli iscritti
        </button>
        <button type="button" className={pill(soloPresenti)} onClick={() => setSoloPresenti(true)}>
          Solo presenti
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {gruppi.map((g) => (
          <ColonnaGruppo key={g.corsoId ?? 'senza'} gruppo={g} indirizzi={indirizzi} corsi={corsi} />
        ))}
      </div>
    </div>
  )
}

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
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-text2">Per indirizzo</h2>
          <Button variant="ghost" className="text-xs print:hidden" onClick={() => window.print()}>
            Stampa
          </Button>
        </div>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text3">
                <th className="py-2 pr-2">Indirizzo</th>
                <th className="px-2 py-2 text-right" title="Scelto all'iscrizione">Iniziali</th>
                <th className="px-2 py-2 text-right">Spostamenti</th>
                <th className="px-2 py-2 text-right">Attuali</th>
                <th className="px-2 py-2 text-right">Presenti</th>
                <th className="py-2 pl-2 text-right">Presenza</th>
              </tr>
            </thead>
            <tbody>
              {righe.map((r) => (
                <tr key={r.corsoId ?? 'senza'} className="border-b border-border last:border-0">
                  <td className="py-2 pr-2 font-bold text-text">
                    {r.nome}
                    {r.fuoriConfigurazione && <span className="ml-1 text-xs font-normal text-orange-dark">(fuori Open Day)</span>}
                    {r.posti_max && <span className="ml-1 text-xs font-normal text-text3">· {r.posti_max} posti</span>}
                  </td>
                  <td className="px-2 py-2 text-right text-text2">{r.iniziali}</td>
                  <td className="px-2 py-2 text-right text-xs">
                    {r.entrati > 0 && <span className="text-green-dark">+{r.entrati}</span>}
                    {r.entrati > 0 && r.usciti > 0 && ' '}
                    {r.usciti > 0 && <span className="text-red-dark">−{r.usciti}</span>}
                    {r.entrati === 0 && r.usciti === 0 && <span className="text-text3">—</span>}
                  </td>
                  <td className="px-2 py-2 text-right font-bold text-text">{r.iscritti}</td>
                  <td className="px-2 py-2 text-right text-text">{r.presenti}</td>
                  <td className="py-2 pl-2 text-right text-text2">{perc(r.presenti, r.iscritti)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border-dark font-bold text-text">
                <td className="py-2 pr-2">Totale</td>
                <td className="px-2 py-2 text-right">{tot.iniziali}</td>
                <td className="px-2 py-2 text-right text-xs text-text2">{cambi.length} cambi</td>
                <td className="px-2 py-2 text-right">{tot.iscritti}</td>
                <td className="px-2 py-2 text-right">{tot.presenti}</td>
                <td className="py-2 pl-2 text-right">{perc(tot.presenti, tot.iscritti)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <Card>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-text2">Cambi di indirizzo ({cambi.length})</h2>
        {cambi.length === 0 && <p className="text-sm text-text3">Nessuno ha cambiato indirizzo rispetto all'iscrizione.</p>}
        {cambi.map((c) => (
          <div key={c.booking.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2 last:border-0">
            <span className="text-sm font-bold text-text">
              {c.booking.cognome} {c.booking.nome}
              {c.booking.checked_in && <span className="ml-2 text-xs text-green">✓ presente</span>}
            </span>
            <span className="text-sm text-text2">
              {c.da} <span className="text-text3">→</span> <strong className="text-text">{c.a}</strong>
            </span>
          </div>
        ))}
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-text">Gruppi d'interesse</h1>
          {openDay && (
            <p className="text-sm text-text3">
              Open Day del{' '}
              {new Date(openDay.data).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })} ·{' '}
              {openDay.ora.slice(0, 5)}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Link to={`/staff/open-days/${openDayId}/iscrizioni`}>
            <Button variant="ghost">Iscrizioni</Button>
          </Link>
          <Link to="/staff/dashboard">
            <Button variant="blue">Monitoraggio</Button>
          </Link>
        </div>
      </div>

      {!configurati && pronto && (
        <p className="rounded-il border border-border bg-gray-xlight px-3 py-2 text-xs text-text2 print:hidden">
          Nessun indirizzo configurato per questo Open Day: sono mostrati tutti i corsi attivi. Puoi sceglierli da{' '}
          <Link to="/staff/open-days" className="font-bold text-blue underline">
            Open Day → Modifica
          </Link>
          .
        </p>
      )}

      <div className="flex gap-1 print:hidden">
        <button type="button" className={pill(vista === 'board')} onClick={() => setVista('board')}>
          Gruppi (live)
        </button>
        <button type="button" className={pill(vista === 'riepilogo')} onClick={() => setVista('riepilogo')}>
          Riepilogo
        </button>
      </div>

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
