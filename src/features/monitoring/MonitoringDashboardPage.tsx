import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Spinner, ErrorBanner } from '../../components/ui/Spinner'
import { CapacityGauge } from '../../components/charts/CapacityGauge'
import { useOpenDays } from '../../hooks/useOpenDays'
import { useBookings } from '../../hooks/useBookings'
import { useMdiList } from '../../hooks/useMdi'
import { useRealtimeOpenDay } from '../../hooks/useRealtimeInvalidate'
import { useNotifiche } from '../../hooks/useNotifiche'
import { useCorsi } from '../../hooks/useCorsi'
import { useOpenDayCorsi } from '../../hooks/useOpenDayCorsi'
import { riepilogoIndirizzi } from '../gruppi/gruppi'
import { RichiesteDaApprovare } from '../bookings/RichiesteDaApprovare'
import { ElencoIscritti } from '../bookings/ElencoIscritti'

function KpiCard({ label, value, colorClass }: { label: string; value: number | string; colorClass: string }) {
  return (
    <Card className={`border-t-4 ${colorClass}`}>
      <p className="text-xs font-bold uppercase tracking-wide text-text3">{label}</p>
      <p className="mt-1 text-2xl font-black text-text">{value}</p>
    </Card>
  )
}

export function MonitoringDashboardPage() {
  const { data: openDays, isLoading, error } = useOpenDays()
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)

  const aperti = openDays?.filter((od) => od.stato === 'aperto') ?? []
  const effectiveSelectedId = selectedId ?? aperti[0]?.id

  const { data: bookings } = useBookings(effectiveSelectedId)
  const { data: mdiList } = useMdiList({ openDayId: effectiveSelectedId })
  const { data: notifiche } = useNotifiche(effectiveSelectedId)
  const { data: corsi } = useCorsi()
  const { indirizzi } = useOpenDayCorsi(effectiveSelectedId)
  useRealtimeOpenDay(effectiveSelectedId)

  const confermati = bookings?.filter((b) => b.status === 'confirmed' || b.status === 'walk_in').length ?? 0
  const waitlist = bookings?.filter((b) => b.status === 'waitlist').length ?? 0
  const daApprovare = bookings?.filter((b) => b.status === 'pending').length ?? 0
  const checkedIn = bookings?.filter((b) => b.checked_in).length ?? 0
  const selectedOpenDay = openDays?.find((od) => od.id === effectiveSelectedId)
  const perIndirizzo = bookings && indirizzi && corsi ? riepilogoIndirizzi(bookings, indirizzi, corsi).filter((r) => r.iscritti > 0 || (r.corsoId && !r.fuoriConfigurazione)) : []

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-text">Monitoraggio Open Day</h1>

      {isLoading && <Spinner />}
      {error && <ErrorBanner message="Errore nel caricamento degli Open Day." />}

      {aperti.length === 0 && !isLoading && (
        <Card>
          <p className="text-sm text-text2">Nessun Open Day aperto al momento.</p>
          <Link to="/staff/open-days" className="mt-3 inline-block">
            <Button variant="blue">Crea un Open Day</Button>
          </Link>
        </Card>
      )}

      {aperti.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2">
            {aperti.map((od) => (
              <button
                key={od.id}
                onClick={() => setSelectedId(od.id)}
                className={`rounded-full border px-3 py-1 text-sm font-bold transition-colors ${
                  effectiveSelectedId === od.id
                    ? 'border-orange bg-orange-light text-orange-dark'
                    : 'border-border text-text2 hover:bg-gray-light'
                }`}
              >
                {new Date(od.data).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })} · {od.ora.slice(0, 5)}
              </button>
            ))}
          </div>

          {selectedOpenDay && (
            <>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                <KpiCard label="Da approvare" value={daApprovare} colorClass="border-red" />
                <KpiCard label="Confermati" value={confermati} colorClass="border-green" />
                <KpiCard label="Lista d'attesa" value={waitlist} colorClass="border-blue" />
                <KpiCard label="Check-in" value={checkedIn} colorClass="border-orange" />
                <KpiCard label="MDI raccolte" value={mdiList?.length ?? 0} colorClass="border-purple" />
              </div>

              {bookings && <RichiesteDaApprovare bookings={bookings} />}

              <Card>
                <CapacityGauge value={confermati} max={selectedOpenDay.posti_max} label="Capienza Open Day" />
              </Card>

              <Card>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-text2">Per indirizzo</h2>
                  <Link to={`/staff/open-days/${selectedOpenDay.id}/gruppi`}>
                    <Button variant="ghost" className="text-xs">
                      Gruppi d'interesse →
                    </Button>
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                  {perIndirizzo.map((r) => (
                    <div key={r.corsoId ?? 'senza'}>
                      <div className="flex items-baseline justify-between gap-2 text-sm">
                        <span className="font-bold text-text">{r.nome}</span>
                        <span className="text-xs text-text3">
                          {r.iscritti} iscritti · {r.presenti} presenti
                          {(r.entrati > 0 || r.usciti > 0) && ` · +${r.entrati}/−${r.usciti}`}
                        </span>
                      </div>
                      {r.posti_max && (
                        <div className="mt-1">
                          <CapacityGauge value={r.iscritti} max={r.posti_max} label="Posti" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              <div className="flex flex-wrap gap-2">
                <Link to={`/staff/open-days/${selectedOpenDay.id}/iscrizioni`}>
                  <Button variant="blue">Gestisci iscrizioni e check-in</Button>
                </Link>
                <Badge color={waitlist > 0 ? 'orange' : 'green'}>
                  {waitlist > 0 ? `${waitlist} in lista d'attesa` : 'Nessuna lista d’attesa'}
                </Badge>
              </div>

              {bookings && <ElencoIscritti bookings={bookings} notifiche={notifiche ?? []} corsi={corsi ?? []} />}
            </>
          )}
        </>
      )}
    </div>
  )
}
