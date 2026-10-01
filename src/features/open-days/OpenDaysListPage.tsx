import { useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Button, Fab, IconButton } from '../../components/ui/Button'
import { Badge, type BadgeColor } from '../../components/ui/Badge'
import { ChipSet, FilterChip } from '../../components/ui/Chip'
import { Icon } from '../../components/ui/Icon'
import { EmptyState, PageHeader, SectionHeader } from '../../components/ui/PageHeader'
import { Spinner, ErrorBanner } from '../../components/ui/Spinner'
import { useEdizioni } from '../../hooks/useEdizioni'
import { useOpenDays } from '../../hooks/useOpenDays'
import { useCorsi } from '../../hooks/useCorsi'
import { useOpenDayCorsiTutti } from '../../hooks/useOpenDayCorsi'
import { useSede } from '../sedi/SedeProvider'
import { EdizioneFormModal } from './EdizioneFormModal'
import { OpenDayFormModal } from './OpenDayFormModal'
import type { OpenDay, StatoOpenDay } from '../../types/database.types'

const STATO_COLOR: Record<StatoOpenDay, BadgeColor> = {
  aperto: 'success',
  chiuso: 'neutral',
  annullato: 'error',
}

const STATO_LABEL: Record<StatoOpenDay, string> = {
  aperto: 'Aperto',
  chiuso: 'Chiuso',
  annullato: 'Annullato',
}

export function OpenDaysListPage() {
  const { sedeId, sede, multiSede, nomeSede } = useSede()
  const { data: edizioni, isLoading: loadingEdizioni, error: edizioniError } = useEdizioni(sedeId)
  const [edizioneId, setEdizioneId] = useState<string | undefined>(undefined)
  const [edizioneModal, setEdizioneModal] = useState<'new' | 'edit' | null>(null)
  const [openDayModal, setOpenDayModal] = useState<'new' | OpenDay | null>(null)

  // Scelta dell'utente se ancora valida (cambiando sede puo' non esserlo), altrimenti l'edizione attiva.
  const activeEdizione =
    edizioni?.find((e) => e.id === edizioneId) ?? edizioni?.find((e) => e.stato === 'attiva') ?? edizioni?.[0]
  const activeEdizioneId = activeEdizione?.id
  // Con "tutte le sedi" le etichette dicono di quale sede e' ogni edizione / Open Day.
  const mostraSede = multiSede && !sedeId
  const { data: openDays, isLoading: loadingOpenDays, error: openDaysError } = useOpenDays({ edizioneId: activeEdizioneId })
  const { data: corsi } = useCorsi()
  const { data: openDayCorsi } = useOpenDayCorsiTutti()
  const indirizziDi = (id: string) =>
    (openDayCorsi ?? []).filter((r) => r.open_day_id === id).flatMap((r) => corsi?.find((c) => c.id === r.corso_id)?.nome ?? [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Open Day"
        subtitle="Edizioni ed eventi di orientamento"
        actions={
          <>
            {/* Link fisso per il tablet della sede: mostra gli Open Day del giorno e cerca solo tra i suoi iscritti. */}
            {sede && (
              <Button
                variant="text"
                icon="assignment"
                trailingIcon="open_in_new"
                href={`/mdi/kiosk/sede/${sede.slug}`}
                target="_blank"
                rel="noreferrer"
              >
                Kiosk MDI della sede
              </Button>
            )}
            <Button variant="outlined" icon="add" onClick={() => setEdizioneModal('new')}>
              Nuova edizione
            </Button>
          </>
        }
      />

      {loadingEdizioni && <Spinner />}
      {edizioniError && <ErrorBanner message="Errore nel caricamento delle edizioni." />}

      {edizioni && edizioni.length === 0 && (
        <Card>
          <EmptyState icon="calendar_add_on">
            Nessuna edizione ancora creata. Crea la prima edizione per poter aggiungere degli Open Day.
          </EmptyState>
        </Card>
      )}

      {edizioni && edizioni.length > 0 && (
        <>
          <ChipSet label="Edizioni" className="-mt-4">
            {edizioni.map((ed) => (
              <FilterChip key={ed.id} selected={activeEdizioneId === ed.id} onClick={() => setEdizioneId(ed.id)}>
                {mostraSede && `${nomeSede(ed.sede_id)} · `}
                {ed.nome} — {ed.anno}
              </FilterChip>
            ))}
          </ChipSet>
          {activeEdizione && (
            <div className="-mt-2">
              <Button variant="text" icon="edit" onClick={() => setEdizioneModal('edit')}>
                Modifica edizione
              </Button>
            </div>
          )}

          <SectionHeader
            title="Eventi"
            actions={
              // Su compact c'è il FAB al suo posto.
              <div className="hidden medium:block">
                <Button icon="add" onClick={() => setOpenDayModal('new')} disabled={!activeEdizioneId}>
                  Nuovo Open Day
                </Button>
              </div>
            }
          />

          {loadingOpenDays && <Spinner />}
          {openDaysError && <ErrorBanner message="Errore nel caricamento degli Open Day." />}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {openDays?.map((od) => (
              <Card key={od.id} className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-title-l text-on-surface">
                      {new Date(od.data).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-body-m text-on-surface-variant">
                      <Icon name="schedule" size={16} />
                      {od.ora.slice(0, 5)} — {od.tipo}
                    </p>
                  </div>
                  <div className="-mr-2 -mt-1 flex shrink-0 items-center gap-1">
                    <Badge color={STATO_COLOR[od.stato]}>{STATO_LABEL[od.stato]}</Badge>
                    <IconButton icon="edit" label="Modifica Open Day" onClick={() => setOpenDayModal(od)} />
                  </div>
                </div>
                {mostraSede && (
                  <p className="-mt-2 flex items-center gap-1 text-body-m text-on-surface-variant">
                    <Icon name="location_on" size={16} />
                    {nomeSede(od.sede_id)}
                  </p>
                )}
                <p className="flex items-center gap-1 text-body-m text-on-surface-variant">
                  <Icon name="event_seat" size={16} />
                  Posti massimi: {od.posti_max}
                </p>
                <div className="flex flex-wrap gap-1">
                  {indirizziDi(od.id).length > 0 ? (
                    indirizziDi(od.id).map((nome) => (
                      <Badge key={nome} color="accent">
                        {nome}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-body-s text-on-surface-variant">Tutti gli indirizzi</span>
                  )}
                </div>
                {/* Azioni con pari peso visivo: tutte tonal, larghe e comode da toccare su smartphone. */}
                <div className="mt-auto grid grid-cols-2 gap-2 border-t border-outline-variant pt-4">
                  <Button variant="tonal" icon="fact_check" to={`/staff/open-days/${od.id}/iscrizioni`}>
                    Iscrizioni
                  </Button>
                  <Button variant="tonal" icon="groups" to={`/staff/open-days/${od.id}/gruppi`}>
                    Gruppi
                  </Button>
                  {/* Kiosk pubblico: aperto in una nuova scheda, da usare sul tablet dell'evento. */}
                  <Button
                    variant="tonal"
                    icon="assignment"
                    trailingIcon="open_in_new"
                    href={`/mdi/kiosk/${od.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="col-span-2"
                  >
                    Kiosk MDI
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          {openDays && openDays.length === 0 && (
            <Card>
              <EmptyState icon="event_busy">Nessun Open Day per questa edizione.</EmptyState>
            </Card>
          )}

          {/* FAB esteso su compact: l'azione principale della schermata resta a portata di pollice. */}
          <Fab
            icon="add"
            className="fixed bottom-24 right-4 z-20 medium:hidden"
            onClick={() => setOpenDayModal('new')}
            disabled={!activeEdizioneId}
          >
            Nuovo Open Day
          </Fab>
        </>
      )}

      {edizioneModal && (
        <EdizioneFormModal
          edizione={edizioneModal === 'edit' ? activeEdizione : undefined}
          onClose={() => setEdizioneModal(null)}
        />
      )}
      {openDayModal && activeEdizione && (
        <OpenDayFormModal
          edizioneId={activeEdizione.id}
          sedeId={activeEdizione.sede_id}
          openDay={openDayModal === 'new' ? undefined : openDayModal}
          onClose={() => setOpenDayModal(null)}
        />
      )}
    </div>
  )
}
