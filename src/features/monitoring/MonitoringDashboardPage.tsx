import { useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Spinner, ErrorBanner } from '../../components/ui/Spinner'
import { Icon } from '../../components/ui/Icon'
import { ChipSet, FilterChip } from '../../components/ui/Chip'
import { EmptyState, PageHeader, SectionHeader } from '../../components/ui/PageHeader'
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

function KpiCard({ label, value, icon, tone }: { label: string; value: number | string; icon: string; tone: string }) {
  return (
    <Card variant="filled" className="!p-4">
      <div className="flex items-center gap-2 text-on-surface-variant">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tone}`}>
          <Icon name={icon} size={20} />
        </span>
        <p className="min-w-0 truncate text-label-l">{label}</p>
      </div>
      <p className="mt-3 text-display-s tabular-nums text-on-surface">{value}</p>
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
      <PageHeader title="Monitoraggio Open Day" subtitle="Dati in tempo reale dell’evento selezionato" />

      {isLoading && <Spinner />}
      {error && <ErrorBanner message="Errore nel caricamento degli Open Day." />}

      {aperti.length === 0 && !isLoading && (
        <Card>
          <EmptyState icon="event_busy">
            <p>Nessun Open Day aperto al momento.</p>
            <Button to="/staff/open-days" icon="add" className="mt-4">
              Crea un Open Day
            </Button>
          </EmptyState>
        </Card>
      )}

      {aperti.length > 0 && (
        <>
          <ChipSet label="Open Day aperti" className="-mt-4">
            {aperti.map((od) => (
              <FilterChip key={od.id} selected={effectiveSelectedId === od.id} onClick={() => setSelectedId(od.id)}>
                {new Date(od.data).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })} · {od.ora.slice(0, 5)}
              </FilterChip>
            ))}
          </ChipSet>

          {selectedOpenDay && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <KpiCard label="Da approvare" value={daApprovare} icon="pending_actions" tone="bg-error-container text-on-error-container" />
                <KpiCard label="Confermati" value={confermati} icon="how_to_reg" tone="bg-success-container text-on-success-container" />
                <KpiCard label="Lista d'attesa" value={waitlist} icon="hourglass_top" tone="bg-tertiary-container text-on-tertiary-container" />
                <KpiCard label="Check-in" value={checkedIn} icon="where_to_vote" tone="bg-primary-container text-on-primary-container" />
                <KpiCard label="MDI raccolte" value={mdiList?.length ?? 0} icon="assignment" tone="bg-accent-container text-on-accent-container" />
              </div>

              {bookings && <RichiesteDaApprovare bookings={bookings} />}

              <Card>
                <CapacityGauge value={confermati} max={selectedOpenDay.posti_max} label="Capienza Open Day" />
              </Card>

              <Card>
                <SectionHeader
                  title="Per indirizzo"
                  actions={
                    <Button variant="text" to={`/staff/open-days/${selectedOpenDay.id}/gruppi`} trailingIcon="arrow_forward">
                      Gruppi d'interesse
                    </Button>
                  }
                />
                <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                  {perIndirizzo.map((r) => (
                    <div key={r.corsoId ?? 'senza'}>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-title-s text-on-surface">{r.nome}</span>
                        <span className="shrink-0 text-body-s text-on-surface-variant">
                          {r.iscritti} iscritti · {r.presenti} presenti
                          {(r.entrati > 0 || r.usciti > 0) && ` · +${r.entrati}/−${r.usciti}`}
                        </span>
                      </div>
                      {r.posti_max && (
                        <div className="mt-2">
                          <CapacityGauge value={r.iscritti} max={r.posti_max} label="Posti" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              <div className="flex flex-wrap items-center gap-3">
                <Button to={`/staff/open-days/${selectedOpenDay.id}/iscrizioni`} icon="fact_check">
                  Gestisci iscrizioni e check-in
                </Button>
                <Badge color={waitlist > 0 ? 'warning' : 'success'}>
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
