import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Spinner, ErrorBanner } from '../../components/ui/Spinner'
import { useEdizioni } from '../../hooks/useEdizioni'
import { useOpenDays } from '../../hooks/useOpenDays'
import { useCorsi } from '../../hooks/useCorsi'
import { useOpenDayCorsiTutti } from '../../hooks/useOpenDayCorsi'
import { EdizioneFormModal } from './EdizioneFormModal'
import { OpenDayFormModal } from './OpenDayFormModal'
import type { OpenDay, StatoOpenDay } from '../../types/database.types'

const STATO_COLOR: Record<StatoOpenDay, 'green' | 'gray' | 'red'> = {
  aperto: 'green',
  chiuso: 'gray',
  annullato: 'red',
}

const STATO_LABEL: Record<StatoOpenDay, string> = {
  aperto: 'Aperto',
  chiuso: 'Chiuso',
  annullato: 'Annullato',
}

export function OpenDaysListPage() {
  const { data: edizioni, isLoading: loadingEdizioni, error: edizioniError } = useEdizioni()
  const [edizioneId, setEdizioneId] = useState<string | undefined>(undefined)
  const [showEdizioneModal, setShowEdizioneModal] = useState(false)
  const [openDayModal, setOpenDayModal] = useState<'new' | OpenDay | null>(null)

  const activeEdizioneId = edizioneId ?? edizioni?.[0]?.id
  const { data: openDays, isLoading: loadingOpenDays, error: openDaysError } = useOpenDays(activeEdizioneId)
  const { data: corsi } = useCorsi()
  const { data: openDayCorsi } = useOpenDayCorsiTutti()
  const indirizziDi = (id: string) =>
    (openDayCorsi ?? []).filter((r) => r.open_day_id === id).flatMap((r) => corsi?.find((c) => c.id === r.corso_id)?.nome ?? [])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-text">Open Day</h1>
        <Button onClick={() => setShowEdizioneModal(true)}>+ Nuova edizione</Button>
      </div>

      {loadingEdizioni && <Spinner />}
      {edizioniError && <ErrorBanner message="Errore nel caricamento delle edizioni." />}

      {edizioni && edizioni.length === 0 && (
        <Card>
          <p className="text-sm text-text2">
            Nessuna edizione ancora creata. Crea la prima edizione per poter aggiungere degli Open Day.
          </p>
        </Card>
      )}

      {edizioni && edizioni.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2">
            {edizioni.map((ed) => (
              <button
                key={ed.id}
                onClick={() => setEdizioneId(ed.id)}
                className={`rounded-full border px-3 py-1 text-sm font-bold transition-colors ${
                  activeEdizioneId === ed.id
                    ? 'border-orange bg-orange-light text-orange-dark'
                    : 'border-border text-text2 hover:bg-gray-light'
                }`}
              >
                {ed.nome} — {ed.anno}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-text3">Eventi</h2>
            <Button variant="blue" onClick={() => setOpenDayModal('new')} disabled={!activeEdizioneId}>
              + Nuovo Open Day
            </Button>
          </div>

          {loadingOpenDays && <Spinner />}
          {openDaysError && <ErrorBanner message="Errore nel caricamento degli Open Day." />}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {openDays?.map((od) => (
              <Card key={od.id} className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-text">
                      {new Date(od.data).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-sm text-text3">{od.ora.slice(0, 5)} — {od.tipo}</p>
                  </div>
                  <Badge color={STATO_COLOR[od.stato]}>{STATO_LABEL[od.stato]}</Badge>
                </div>
                <p className="text-sm text-text2">Posti massimi: {od.posti_max}</p>
                <div className="flex flex-wrap gap-1">
                  {indirizziDi(od.id).length > 0 ? (
                    indirizziDi(od.id).map((nome) => (
                      <Badge key={nome} color="purple">
                        {nome}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-text3">Tutti gli indirizzi</span>
                  )}
                </div>
                <div className="mt-auto flex flex-wrap gap-2">
                  <Button variant="ghost" onClick={() => setOpenDayModal(od)}>
                    Modifica
                  </Button>
                  <Link to={`/staff/open-days/${od.id}/iscrizioni`}>
                    <Button variant="blue">Iscrizioni</Button>
                  </Link>
                  <Link to={`/staff/open-days/${od.id}/gruppi`}>
                    <Button variant="ghost">Gruppi</Button>
                  </Link>
                  {/* Kiosk pubblico: aperto in una nuova scheda, da usare sul tablet dell'evento. */}
                  <a href={`/mdi/kiosk/${od.id}`} target="_blank" rel="noreferrer">
                    <Button variant="ghost">Kiosk MDI ↗</Button>
                  </a>
                </div>
              </Card>
            ))}
            {openDays && openDays.length === 0 && (
              <p className="text-sm text-text3">Nessun Open Day per questa edizione.</p>
            )}
          </div>
        </>
      )}

      {showEdizioneModal && <EdizioneFormModal onClose={() => setShowEdizioneModal(false)} />}
      {openDayModal && activeEdizioneId && (
        <OpenDayFormModal
          edizioneId={activeEdizioneId}
          openDay={openDayModal === 'new' ? undefined : openDayModal}
          onClose={() => setOpenDayModal(null)}
        />
      )}
    </div>
  )
}
